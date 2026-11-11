import { units } from '../data/course'
import type { Progress } from '../store/types'

export function lessonKey(unitId: number, lesson: number): string {
  return `u${unitId}-l${lesson}`
}

export function isLessonDone(progress: Progress, unitId: number, lesson: number): boolean {
  return !!progress.completed[lessonKey(unitId, lesson)]
}

export function isUnitUnlocked(progress: Progress, unitId: number): boolean {
  if (unitId === 1) return true
  return isLessonDone(progress, unitId - 1, 0)
}

export function isLessonUnlocked(progress: Progress, unitId: number, lesson: number): boolean {
  if (!isUnitUnlocked(progress, unitId)) return false
  if (lesson === 1) return true
  if (lesson === 0) return isLessonDone(progress, unitId, 4)
  return isLessonDone(progress, unitId, lesson - 1)
}

export function unitDoneCount(progress: Progress, unitId: number): number {
  return [1, 2, 3, 4, 0].filter((lesson) => isLessonDone(progress, unitId, lesson)).length
}

export function unitProgress(progress: Progress, unitId: number): number {
  return unitDoneCount(progress, unitId) / 5
}

export function nextLesson(progress: Progress): { unitId: number; lesson: number } | null {
  for (const unit of units) {
    if (!isUnitUnlocked(progress, unit.id)) continue
    for (const lesson of [1, 2, 3, 4, 0]) {
      if (!isLessonDone(progress, unit.id, lesson) && isLessonUnlocked(progress, unit.id, lesson)) {
        return { unitId: unit.id, lesson }
      }
    }
  }
  return null
}

export function nextLessonAfter(unitId: number, lesson: number): { unitId: number; lesson: number } | null {
  if (lesson >= 1 && lesson <= 4) return { unitId, lesson: lesson + 1 }
  if (lesson === 0 && unitId < units.length) return { unitId: unitId + 1, lesson: 1 }
  return null
}

export function totalCompletedLessons(progress: Progress): number {
  return Object.keys(progress.completed).length
}

export function currentUnit(progress: Progress): number {
  const next = nextLesson(progress)
  return next?.unitId ?? units.length
}
