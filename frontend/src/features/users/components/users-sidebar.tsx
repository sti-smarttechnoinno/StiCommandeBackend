'use client';

import { UserStatisticsCard } from './user-statistics-card';
import { OnlineUsersCard } from './online-users-card';
import { PasswordExpiryCard } from './password-expiry-card';
import { TwoFactorCard } from './two-factor-card';

export function UsersSidebar() {
  return (
    <div className="space-y-6">
      <UserStatisticsCard />
      <OnlineUsersCard />
      <PasswordExpiryCard />
      <TwoFactorCard />
    </div>
  );
}
