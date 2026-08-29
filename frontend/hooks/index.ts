// The real-time hooks that are actually mounted.
//
// Six others lived here — news, reviews, guides, shop, comments and
// notifications — fully written and imported by nothing. They were a second
// implementation of what the pages already do through SWR and ISR, kept alive
// only by this file re-exporting them.
//
// The backend still broadcasts `NotificationReceived` on the private
// `user.{id}` channel. That one is deliberately left in place: it is private,
// it fires only when a notification is actually created, and wiring push
// notifications later is then a frontend-only job. (Presence broadcasting was
// removed outright, because that one was public and fired every two minutes
// per player whether anything had changed or not.)
export { useRealTimeForum, useRealTimeThreadReplies } from './useRealTimeForum';
