import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import type { AdminUser } from '../api';
import { useAuth } from '../auth';
import { LoadingScreen } from '@/components/ui/spinner';

type ModalType = 'add' | 'edit' | 'password' | 'clear' | null;

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'aiuser' | 'user'>('user');

  const loadUsers = async () => {
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const openModal = (type: ModalType, user?: AdminUser) => {
    clearMessages();
    setModalType(type);
    setSelectedUser(user ?? null);
    if (type === 'add') {
      setFormEmail('');
      setFormPassword('');
      setFormRole('user');
    } else if (type === 'edit' && user) {
      setFormEmail(user.email);
      setFormRole(user.role);
    } else if (type === 'password') {
      setFormPassword('');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!formEmail.trim() || !formPassword.trim()) {
      setError('Email and password are required');
      return;
    }

    try {
      const newUser = await adminApi.createUser({
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });
      setUsers((prev) => [...prev, newUser]);
      setSuccess('User created successfully');
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!selectedUser) return;

    try {
      const updated = await adminApi.updateUser(selectedUser.id, {
        email: formEmail.trim() || undefined,
        role: formRole,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setSuccess('User updated successfully');
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!selectedUser || !formPassword.trim()) {
      setError('Password is required');
      return;
    }

    try {
      await adminApi.setPassword(selectedUser.id, formPassword);
      setSuccess(`Password updated for ${selectedUser.email}`);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    }
  };

  const handleClearData = async () => {
    clearMessages();

    if (!selectedUser) return;

    try {
      await adminApi.clearUserData(selectedUser.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, companiesCount: 0, applicationsCount: 0, jobBoardsCount: 0 } : u
        )
      );
      setSuccess(`All data cleared for ${selectedUser.email}`);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear user data');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    clearMessages();

    if (user.id === currentUser?.id) {
      setError('Cannot delete your own account');
      return;
    }

    if (!confirm(`Delete user "${user.email}"? This will permanently delete the user and ALL their data.`)) {
      return;
    }

    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSuccess('User deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading users..." />;
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-600 text-white',
    aiuser: 'bg-purple-600 text-white',
    user: 'bg-gray-600 text-gray-200',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Administration</h1>
        <button
          onClick={() => openModal('add')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
        >
          + Add User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-md text-green-300">{success}</div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Companies</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Applications</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-gray-100">
                  {user.email}
                  {user.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-gray-500">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-300">{user.companiesCount}</td>
                <td className="px-4 py-3 text-center text-gray-300">{user.applicationsCount}</td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openModal('edit', user)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openModal('password', user)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      Password
                    </button>
                    <button
                      onClick={() => openModal('clear', user)}
                      className="text-orange-400 hover:text-orange-300 text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.id === currentUser?.id}
                      className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">No users found</div>
        )}
      </div>

      {/* Add User Modal */}
      {modalType === 'add' && (
        <Modal title="Add New User" onClose={closeModal}>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as typeof formRole)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="aiuser">AI User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
              >
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {modalType === 'edit' && selectedUser && (
        <Modal title={`Edit User: ${selectedUser.email}`} onClose={closeModal}>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as typeof formRole)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="aiuser">AI User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Set Password Modal */}
      {modalType === 'password' && selectedUser && (
        <Modal title={`Set Password: ${selectedUser.email}`} onClose={closeModal}>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white font-medium transition-colors"
              >
                Set Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clear Data Modal */}
      {modalType === 'clear' && selectedUser && (
        <Modal title="Clear User Data" onClose={closeModal}>
          <div className="space-y-4">
            <div className="p-4 bg-orange-900/30 border border-orange-700 rounded-md">
              <p className="text-orange-200">
                This will permanently delete all data for <strong>{selectedUser.email}</strong>:
              </p>
              <ul className="mt-2 text-sm text-orange-300 list-disc list-inside">
                <li>{selectedUser.companiesCount} companies</li>
                <li>{selectedUser.applicationsCount} applications</li>
                <li>All job boards, tags, and transitions</li>
              </ul>
              <p className="mt-2 text-orange-200">The user account will be kept.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-white font-medium transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
