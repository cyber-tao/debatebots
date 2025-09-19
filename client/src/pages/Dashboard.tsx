import React from 'react';
import { PlusIcon, Cog6ToothIcon, PlayIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Card, EmptyState, Badge, LoadingSpinner } from '../components/UIComponents';
import { Button } from '../components/FormComponents';
import { useApi } from '../hooks/useApi';
import { debateService } from '../services/debateService';
import { DebateSession } from '../types';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { data: sessions, loading, error, refresh } = useApi(
    () => debateService.sessions.getAll(),
    []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green';
      case 'completed': return 'blue';
      case 'paused': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading dashboard</div>
        <Button onClick={refresh}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your AI debate sessions and configurations
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/api-configs'}
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            API Configs
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/participants'}
          >
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Manage Bots
          </Button>
          <Button onClick={() => window.location.href = '/debates/new'}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Debate
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Debates
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Debates
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions?.filter(s => s.status === 'running').length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions?.filter(s => s.status === 'completed').length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-purple-400 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Success Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions?.length ? 
                      Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100) : 0
                    }%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Debates */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Debates</h3>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/debates'}>
            View All
          </Button>
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card>
            <EmptyState
              title="No debates yet"
              description="Get started by creating your first AI debate session"
              action={
                <Button onClick={() => window.location.href = '/debates/new'}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Debate
                </Button>
              }
              icon={<PlayIcon className="h-12 w-12" />}
            />
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {sessions.slice(0, 5).map((session: DebateSession) => (
                  <li key={session.id}>
                    <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                         onClick={() => window.location.href = `/debates/${session.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {session.topic}
                            </h4>
                            <Badge variant={getStatusColor(session.status) as any}>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Round {session.currentRound}/{session.maxRounds}</span>
                            <span>•</span>
                            <span>{session.participants?.length || 0} participants</span>
                            <span>•</span>
                            <span>{format(new Date(session.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.status === 'running' && (
                            <div className="flex items-center">
                              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="ml-2 text-sm text-green-600">Live</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;