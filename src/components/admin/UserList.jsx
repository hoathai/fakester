import React, { useState, useEffect } from 'react';
import { getAllUsers, getUserRole } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Search, CreditCard as Edit2, Shield, Users } from 'lucide-react';

const ROLE_COLORS = {
  RootUser: 'bg-red-500',
  AdminUser: 'bg-blue-500',
  CustomerUser: 'bg-green-500'
};

const STATUS_COLORS = {
  active: 'bg-green-500',
  suspended: 'bg-yellow-500',
  deleted: 'bg-gray-500'
};

export default function UserList({ onEditUser, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('CustomerUser');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadCurrentUserRole();
  }, []);

  const loadCurrentUserRole = async () => {
    const { data } = await getUserRole(currentUserId);
    setCurrentUserRole(data);
  };

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await getAllUsers();
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query)
    );
  });

  const canEditUser = (targetUserRole) => {
    if (currentUserRole === 'RootUser') return true;
    if (currentUserRole === 'AdminUser' && targetUserRole === 'CustomerUser') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">User Management</h2>
        </div>
        <Badge className={ROLE_COLORS[currentUserRole]}>
          <Shield className="h-3 w-3 mr-1" />
          {currentUserRole}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          className="pl-10"
          placeholder="Search users by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(user => {
            const userRole = user.user_roles?.[0]?.role || 'CustomerUser';
            const canEdit = canEditUser(userRole);

            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {user.display_name || 'Unnamed User'}
                        </h3>
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">{user.email}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${ROLE_COLORS[userRole]} text-white`}>
                          {userRole}
                        </Badge>
                        <Badge className={`${STATUS_COLORS[user.status]} text-white`}>
                          {user.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        {user.last_login && (
                          <span className="text-xs text-muted-foreground">
                            Last login: {new Date(user.last_login).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditUser(user)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
