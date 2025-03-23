import sqlite3 from 'sqlite3';
import { Survey, Goal, User } from '@shared/schema';

const db = new sqlite3.Database('emerge.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');
});

process.on('exit', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
  });
});

export const storage = {
  async submitSurvey(surveyData: Survey) {
    return new Promise((resolve, reject) => {
      // First ensure the default user exists
      db.run(`INSERT OR IGNORE INTO users (id, username, password) VALUES (1, 'default', 'default')`);

      // Delete existing profile if any
      db.run('DELETE FROM user_profiles WHERE user_id = 1');

      const stmt = db.prepare(
        'INSERT INTO user_profiles (user_id, subjects, interests, skills, goal, thinking_style, extra_info, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );

      const userId = 1;

      stmt.run(
        [
          userId,
          JSON.stringify(surveyData.subjects),
          surveyData.interests,
          surveyData.skills,
          surveyData.goal,
          surveyData.thinking_style,
          surveyData.extra_info || '',
          new Date().toISOString()
        ],
        function(err) {
          if (err) reject(err);
          resolve({ 
            userId, 
            profile: {
              ...surveyData,
              created_at: new Date().toISOString()
            }
          });
        }
      );
    });
  },

  async getUserProfile(userId: number) {
    return new Promise((resolve, reject) => {
      db.get('SELECT subjects, interests, skills, goal, thinking_style, extra_info, created_at FROM user_profiles WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        try {
          row.subjects = JSON.parse(row.subjects || '[]');
          resolve(row);
        } catch (e) {
          console.error('Error parsing subjects:', e);
          row.subjects = [];
          resolve(row);
        }
      });
    });
  },

  async getUser(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row || null);
      });
    });
  },

  async getUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        resolve(row || null);
      });
    });
  },

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    });

    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  },

  async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO goals (task, completed, user_id) VALUES (?, ?, ?)');
      stmt.run([goal.task, goal.completed ? 1 : 0, goal.userId], function(err) {
        if (err) reject(err);
        resolve({ ...goal, id: this.lastID.toString() });
      });
    });
  },

  async getGoals(userId: number): Promise<Goal[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM goals WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        resolve(rows?.map(row => ({
          ...row,
          id: row.id.toString(),
          completed: Boolean(row.completed)
        })) || []);
      });
    });
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE goals SET completed = ? WHERE id = ?',
        [updates.completed ? 1 : 0, id],
        async (err) => {
          if (err) reject(err);
          try {
            const row = await new Promise((resolve, reject) => {
              db.get('SELECT * FROM goals WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
              });
            });
            
            if (!row) resolve(null);
            
            // Calculate new progress
            const goals = await this.getGoals(row.user_id);
            const completedGoals = goals.filter(g => g.completed).length;
            const progress = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
            
            // Update user progress
            await new Promise((resolve, reject) => {
              db.run('UPDATE users SET progress = ? WHERE id = ?', [progress, row.user_id], (err) => {
                if (err) reject(err);
                resolve(null);
              });
            });

            resolve({
              ...row,
              id: row.id.toString(),
              completed: Boolean(row.completed)
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  },

  async deleteGoal(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM goals WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  },

  // Activity tracking
  async createActivity(activity: {
    userId: number;
    type: 'lesson' | 'badge' | 'course';
    title: string;
  }) {
    const timestamp = new Date().toISOString();
    await db.run(
      'INSERT INTO activities (user_id, type, title, created_at) VALUES (?, ?, ?, ?)',
      [activity.userId, activity.type, activity.title, timestamp]
    );
  },

  async getActivities(userId: number) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId],
        (err, activities) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      time: formatTimeAgo(new Date(activity.created_at)),
      isRecent: isRecent(new Date(activity.created_at))
    })));
        }
      );
    });
  }
};


function formatTimeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

function isRecent(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < 1000 * 60 * 60 * 24 * 2; // Less than 2 days old
}