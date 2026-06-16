import { CheckCircle2, Circle, Star, Timer } from 'lucide-react';
import type { ReviewQueueKind } from '../services/StudyProgress';
import type { StudyStatus } from '../types';

export const getPointUniqueId = (
  chapterId: string,
  pointId: string,
  uniqueId?: string
) => uniqueId ?? `${chapterId}_${pointId}`;

export const defaultStudyRecord = {
  favorite: false,
  status: 'not-started' as const
};

export type StudyFilter = 'all' | 'favorites' | StudyStatus;

export const studyStatusOptions: Array<{
  value: StudyStatus;
  label: string;
  icon: typeof Circle;
}> = [
  { value: 'not-started', label: '未学习', icon: Circle },
  { value: 'studying', label: '学习中', icon: Timer },
  { value: 'mastered', label: '已掌握', icon: CheckCircle2 }
];

export const reviewQueueOptions: Array<{ value: ReviewQueueKind; label: string }> = [
  { value: 'smart', label: '智能复习' },
  { value: 'studying', label: '学习中' },
  { value: 'not-started', label: '未学习' },
  { value: 'favorites', label: '收藏' }
];

export const renderStars = (count: number) => {
  if (!count) return null;
  const currentCount = Math.min(count, 5);
  return (
    <div className="point-stars">
      {Array.from({ length: currentCount }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={count >= 4 ? 'star-high' : 'star-normal'}
          fill="currentColor"
        />
      ))}
    </div>
  );
};
