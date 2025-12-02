/**
 * UserManagementSection Component
 *
 * Admin-only section for managing users within the Settings page.
 * Provides user listing, invite, edit, and delete functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { adminApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import Skeleton from '../common/Skeleton';
import Modal from '../common/Modal';
import InviteUserModal from './InviteUserModal';
import EditUserModal from './EditUserModal';
import styles from './UserManagementSection.module.css';

export default function UserManagementSection() {
  const { isAdmin, profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.listUsers();
      setUsers(result.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleUserInvited = useCallback((user) => {
    setUsers((prev) => [...prev, user]);
    setShowInviteModal(false);
  }, []);

  const handleUserUpdated = useCallback((updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setEditingUser(null);
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      await adminApi.deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingUser]);

  const handleResendInvite = useCallback(async (userId) => {
    setResendingInvite(userId);
    try {
      await adminApi.resendInvite(userId);
      // Show success feedback (update user state to show "Invite sent")
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, inviteResent: true } : u
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to resend invite');
    } finally {
      setResendingInvite(null);
    }
  }, []);

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Filter users based on search and admin filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterAdmin === 'all' ||
      (filterAdmin === 'admin' && user.isAdmin) ||
      (filterAdmin === 'user' && !user.isAdmin);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <PSXSprite sprite="lock" size="md" />
            <h2>User Management</h2>
          </div>
        </div>
        <Card>
          <Skeleton variant="row" count={3} />
        </Card>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <PSXSprite sprite="lock" size="md" />
          <h2>User Management</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowInviteModal(true)}
        >
          + Invite User
        </Button>
      </div>

      <p className={styles.sectionDescription}>
        Manage user accounts and client access. Users are invite-only.
      </p>

      {error && (
        <div className={styles.errorBanner}>
          <Icon name="alert" size={16} />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Search and Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Icon name="search" size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            maxLength={100}
            aria-label="Search users by email or name"
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="user-filter" className={styles.filterLabel}>
            Filter:
          </label>
          <select
            id="user-filter"
            value={filterAdmin}
            onChange={(e) => setFilterAdmin(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins Only</option>
            <option value="user">Non-Admins</option>
          </select>
        </div>
      </div>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <div className={styles.empty}>
            <Icon name="users" size={48} />
            <p>{users.length === 0 ? 'No users yet' : 'No users match your search'}</p>
            {users.length === 0 && (
              <Button onClick={() => setShowInviteModal(true)}>
                Invite First User
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className={styles.userList}>
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUserId={profile?.id}
              onEdit={() => setEditingUser(user)}
              onDelete={() => setDeletingUser(user)}
              onResendInvite={() => handleResendInvite(user.id)}
              isResending={resendingInvite === user.id}
            />
          ))}
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          onSuccess={handleUserInvited}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSuccess={handleUserUpdated}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingUser(null)}
          title="Delete User"
          size="sm"
        >
          <div className={styles.deleteConfirm}>
            <PSXSprite sprite="tubeRed" size="lg" />
            <p>
              Are you sure you want to delete <strong>{deletingUser.email}</strong>?
            </p>
            <p className={styles.deleteWarning}>
              This will remove their access to all assigned clients. This action cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <Button
                variant="secondary"
                onClick={() => setDeletingUser(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
                loading={deleteLoading}
              >
                Delete User
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

/**
 * UserCard - Individual user display
 */
function UserCard({ user, currentUserId, onEdit, onDelete, onResendInvite, isResending }) {
  const isCurrentUser = user.id === currentUserId;
  const isUnconfirmed = !user.emailConfirmedAt;

  return (
    <Card className={styles.userCard}>
      <div className={styles.userHeader}>
        <div className={styles.userAvatar}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(user.displayName || user.email)?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName}>
            {user.displayName || user.email?.split('@')[0]}
            {isCurrentUser && <span className={styles.youBadge}>You</span>}
          </h3>
          <span className={styles.userEmail}>{user.email}</span>
        </div>
        <div className={styles.userBadges}>
          {user.isAdmin && (
            <span className={styles.adminBadge}>Admin</span>
          )}
          {!user.isActive && (
            <span className={styles.inactiveBadge}>Inactive</span>
          )}
          {isUnconfirmed && (
            <span className={styles.pendingBadge}>Pending</span>
          )}
        </div>
      </div>

      {user.assignedClients?.length > 0 && (
        <div className={styles.clientList}>
          <span className={styles.clientLabel}>Clients:</span>
          {user.assignedClients.slice(0, 3).map((assignment) => (
            <span key={assignment.clientId} className={styles.clientBadge}>
              {assignment.client?.name || assignment.clientId}
              <span className={styles.roleBadge}>{assignment.role}</span>
            </span>
          ))}
          {user.assignedClients.length > 3 && (
            <span className={styles.moreClients}>
              +{user.assignedClients.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className={styles.userActions}>
        {isUnconfirmed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResendInvite}
            loading={isResending}
            disabled={user.inviteResent}
          >
            {user.inviteResent ? 'Invite Sent' : 'Resend Invite'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isCurrentUser}
          title={isCurrentUser ? "You can't delete yourself" : 'Delete user'}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    avatarUrl: PropTypes.string,
    isAdmin: PropTypes.bool,
    isActive: PropTypes.bool,
    emailConfirmedAt: PropTypes.string,
    assignedClients: PropTypes.arrayOf(
      PropTypes.shape({
        clientId: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
        client: PropTypes.shape({
          name: PropTypes.string,
        }),
      })
    ),
    inviteResent: PropTypes.bool,
  }).isRequired,
  currentUserId: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onResendInvite: PropTypes.func.isRequired,
  isResending: PropTypes.bool,
};
