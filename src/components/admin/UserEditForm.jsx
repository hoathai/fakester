import React, { useState } from 'react';
import { updateUserProfile, updateUserRole } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { X } from 'lucide-react';

const ROLES = ['RootUser', 'AdminUser', 'CustomerUser'];
const STATUSES = ['active', 'suspended', 'deleted'];

export default function UserEditForm({ user, currentUserRole, onComplete, onCancel }) {
  const [formData, setFormData] = useState({
    display_name: user.display_name || '',
    status: user.status || 'active',
    role: user.user_roles?.[0]?.role || 'CustomerUser'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const canChangeRole = () => {
    if (currentUserRole === 'RootUser') return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: profileError } = await updateUserProfile(user.id, {
        display_name: formData.display_name,
        status: formData.status,
        updated_at: new Date().toISOString()
      });

      if (profileError) throw profileError;

      if (canChangeRole() && formData.role !== (user.user_roles?.[0]?.role || 'CustomerUser')) {
        const { error: roleError } = await updateUserRole(user.id, formData.role);
        if (roleError) throw roleError;
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit User</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="display_name" className="text-sm font-medium">Display Name</label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Enter display name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">Status</label>
            <Select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {canChangeRole() && (
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Role</label>
              <Select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Only RootUser can change roles
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">User ID</label>
            <Input
              type="text"
              value={user.id}
              disabled
              className="bg-muted font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Created At</label>
            <Input
              type="text"
              value={new Date(user.created_at).toLocaleString()}
              disabled
              className="bg-muted"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
