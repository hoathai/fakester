import React, { useState, useEffect } from 'react';
import { getActivityLogs } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Activity, RefreshCw } from 'lucide-react';

const ACTION_COLORS = {
  user_created: 'bg-green-500',
  user_updated: 'bg-blue-500',
  user_deleted: 'bg-red-500',
  role_changed: 'bg-purple-500',
  login: 'bg-gray-500',
  logout: 'bg-gray-500'
};

const ACTION_LABELS = {
  user_created: 'User Created',
  user_updated: 'User Updated',
  user_deleted: 'User Deleted',
  role_changed: 'Role Changed',
  login: 'Login',
  logout: 'Logout'
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await getActivityLogs(100);
    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Activity Log</h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No activity logs yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map(log => (
                <div key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${ACTION_COLORS[log.action] || 'bg-gray-500'} text-white`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                        <span className="text-sm font-medium">
                          {log.user_profiles?.display_name || log.user_profiles?.email || 'Unknown User'}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {log.resource_type}
                        {log.resource_id && ` (ID: ${log.resource_id.substring(0, 8)}...)`}
                      </p>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
