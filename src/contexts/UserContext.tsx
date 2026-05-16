import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  avatar: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (data: Partial<UserProfile>) => void;
  bmi: number;
}

const defaultUser: UserProfile = {
  name: '陈爷爷',
  age: 85,
  height: 170,
  weight: 65,
  avatar: '/grandpa-avatar.jpg',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : defaultUser;
  });

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }, [user]);

  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  const bmi = user.height > 0 ? user.weight / Math.pow(user.height / 100, 2) : 0;

  return (
    <UserContext.Provider value={{ user, updateUser, bmi }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
