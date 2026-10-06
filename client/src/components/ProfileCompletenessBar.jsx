import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ProfileCompletenessBar = ({ percentage = 0 }) => {
  const getColor = () => {
    if (percentage < 33) return 'bg-red-500';
    if (percentage < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (percentage < 33) return 'Incomplete';
    if (percentage < 66) return 'In Progress';
    return 'Complete';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {percentage >= 66 ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <AlertCircle size={16} className="text-amber-500" />
          )}
          <span className="text-sm font-medium text-gray-700">
            Profile Completeness
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-600">
        Status: <span className="font-medium">{getStatusText()}</span>
      </p>
    </div>
  );
};

export default ProfileCompletenessBar;

