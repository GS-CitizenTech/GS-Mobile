import { useState } from 'react';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { logout } from '../services/authService';

export default function RootNavigator() {
  const [user, setUser] = useState(null);

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
  }

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (!user) {
    return <AuthNavigator onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AppNavigator
      user={user}
      onLogout={handleLogout}
    />
  );
}
