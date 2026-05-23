import { INITIAL_MOCK_DATA } from './mock-data';

class MockSupabaseClient {
  private data: any;

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('supabase_mock_data') : null;
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = INITIAL_MOCK_DATA;
      this.save();
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_mock_data', JSON.stringify(this.data));
    }
  }

  from(table: string) {
    const tableData = this.data[table] || [];

    const createQuery = (currentData: any[]) => {
      const builder: any = {
        data: currentData,
        error: null,
        select: (columns: string = '*') => builder,
        eq: (col: string, val: any) => createQuery(currentData.filter(i => i[col] === val)),
        order: (col: string, opts: any) => {
          const sorted = [...currentData].sort((a, b) => {
            if (a[col] < b[col]) return opts?.ascending ? -1 : 1;
            if (a[col] > b[col]) return opts?.ascending ? 1 : -1;
            return 0;
          });
          return createQuery(sorted);
        },
        maybeSingle: () => Promise.resolve({ data: currentData[0] || null, error: null }),
        single: () => Promise.resolve({ data: currentData[0] || null, error: null }),
        insert: (payload: any) => {
          const items = Array.isArray(payload) ? payload : [payload];
          const newItems = items.map(i => ({ ...i, id: i.id || Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
          if (!this.data[table]) this.data[table] = [];
          this.data[table].push(...newItems);
          this.save();
          return createQuery(newItems);
        },
        update: (updates: any) => ({
          eq: (col: string, val: any) => {
            const affected: any[] = [];
            this.data[table] = this.data[table].map((i: any) => {
              if (i[col] === val) {
                const updated = { ...i, ...updates };
                affected.push(updated);
                return updated;
              }
              return i;
            });
            this.save();
            return createQuery(affected);
          }
        }),
        delete: () => ({
          eq: (col: string, val: any) => {
            this.data[table] = this.data[table].filter((i: any) => i[col] !== val);
            this.save();
            return Promise.resolve({ error: null });
          }
        }),
        then: (cb: any) => Promise.resolve({ data: builder.data, error: builder.error }).then(cb),
        catch: (cb: any) => Promise.resolve({ data: builder.data, error: builder.error }).catch(cb)
      };
      return builder;
    };

    return createQuery(tableData);
  }

  auth = {
    getSession: () => Promise.resolve({ data: { session: this.getMockSession() }, error: null }),
    onAuthStateChange: (cb: any) => {
      setTimeout(() => cb('SIGNED_IN', this.getMockSession()), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: ({ email }: any) => {
      const session = { 
        user: { 
          id: 'user-1', 
          email, 
          user_metadata: { full_name: 'Usuário Local' },
          role: 'authenticated'
        }, 
        access_token: 'mock-token' 
      };
      localStorage.setItem('supabase_mock_session', JSON.stringify(session));
      return Promise.resolve({ data: session, error: null });
    },
    signOut: () => {
      localStorage.removeItem('supabase_mock_session');
      localStorage.removeItem('user_role');
      return Promise.resolve({ error: null });
    },
    signUp: ({ email }: any) => {
      const session = { user: { id: 'user-1', email }, access_token: 'mock-token' };
      return Promise.resolve({ data: session, error: null });
    },
    signInWithOAuth: () => Promise.resolve({ error: null })
  };

  private getMockSession() {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('supabase_mock_session');
    if (session) return JSON.parse(session);
    
    // Default session for local access
    return { 
      user: INITIAL_MOCK_DATA.profiles[0], 
      access_token: 'mock-token' 
    };
  }
}

export const mockSupabase = new MockSupabaseClient() as any;
