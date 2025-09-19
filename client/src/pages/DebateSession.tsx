import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, LoadingSpinner } from '../components/UIComponents';
import { Button } from '../components/FormComponents';
import { useDebateSession } from '../hooks/useDebateSession';
import { format } from 'date-fns';

const DebateSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isExporting, setIsExporting] = useState(false);
  
  const {
    session,
    messages,
    loading,
    error,
    startDebate,
    pauseDebate,
    stopDebate,
  } = useDebateSession(id!);

  const handleExport = async () => {
    if (!session) return;
    
    setIsExporting(true);
    try {
      const { debateService } = await import('../services/debateService');
      const blob = await debateService.sessions.export(session.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debate-${session.id}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green';
      case 'completed': return 'blue';
      case 'paused': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStanceColor = (stance: string) => {
    return stance === 'pro' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Session not found'}</div>
        <Button onClick={() => window.location.href = '/debates'}>
          Back to Debates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {session.topic}
          </h2>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <Badge variant={getStatusColor(session.status) as any}>
              {session.status}
            </Badge>
            <span>Round {session.currentRound}/{session.maxRounds}</span>
            <span>•</span>
            <span>{format(new Date(session.createdAt), 'PPp')}</span>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          <Button
            variant="outline"
            onClick={handleExport}
            loading={isExporting}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {session.status === 'created' || session.status === 'paused' ? (
            <Button onClick={startDebate}>
              <PlayIcon className="h-4 w-4 mr-2" />
              {session.status === 'created' ? 'Start Debate' : 'Resume'}
            </Button>
          ) : session.status === 'running' ? (
            <>
              <Button variant="outline" onClick={pauseDebate}>
                <PauseIcon className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="danger" onClick={stopDebate}>
                <StopIcon className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Debate Messages */}
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Debate Transcript</h3>
              {session.status === 'running' && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Live debate in progress...
                </div>
              )}
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  {session.status === 'created' ? 
                    'Debate hasn\'t started yet' : 
                    'No messages yet'
                  }
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className={`h-4 w-4 ${getStanceColor(message.stance!)}`} />
                        <span className="font-medium text-gray-900">
                          {message.participantName}
                        </span>
                        <Badge variant={message.stance === 'pro' ? 'green' : 'red'} size="sm">
                          {message.stance?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Round {message.round} • {message.wordCount} words
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {format(new Date(message.timestamp), 'HH:mm:ss')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <Badge variant={getStatusColor(session.status) as any}>
                    {session.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Progress</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Round {session.currentRound} of {session.maxRounds}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Word Limit</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {session.maxWordsPerTurn} words per turn
                </dd>
              </div>
              {session.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {session.description}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Participants */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Participants</h3>
            <div className="space-y-3">
              {session.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserIcon className={`h-4 w-4 ${getStanceColor(participant.stance)}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {participant.name}
                    </span>
                  </div>
                  <Badge variant={participant.stance === 'pro' ? 'green' : 'red'} size="sm">
                    {participant.stance.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Judges */}
          {session.judges.length > 0 && (
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Judges</h3>
              <div className="space-y-2">
                {session.judges.map((judge) => (
                  <div key={judge.id} className="text-sm text-gray-900">
                    {judge.name}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebateSession;