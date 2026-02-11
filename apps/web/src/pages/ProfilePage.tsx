import { useAuth } from '../auth';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 text-left">Profile</h1>
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-left text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <p className="text-white text-left">
              {user?.email}
            </p>
          </div>
          <div>
            <label className="block text-left text-sm font-medium text-gray-400 mb-1">
              Role
            </label>
            <p className="text-white text-left capitalize">
              {user?.role}
            </p>
          </div>
          <div>
            <label className="block text-left text-sm font-medium text-gray-400 mb-1">
              Timezone
            </label>
            <p className="text-white text-left">
              {user?.timezone || 'Not set'}
            </p>
          </div>
        </div>
        <p className="text-gray-500 mt-6 text-sm text-left">
          More profile options coming soon...
        </p>
      </div>
    </div>
  );
}
