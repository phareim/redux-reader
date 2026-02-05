# UI Components

## Layout
- AppShell with sidebar, main reader column, optional notes panel.
- Responsive layout collapses sidebar to drawer on mobile.

## Navigation
- FeedList with unread counts and tag badges.
- TagList with autocomplete search.
- SavedList view with filters.

## Reading
- CardStream with infinite scroll.
- FeedCard with title, source, time, excerpt, actions.
- ReaderView for focused reading of one item.

## Saving and Tagging
- SaveButton with quick tag overlay.
- TagInput with autocomplete and create-on-enter.

## Annotation
- TextSelectionToolbar with Highlight and Comment.
- InlineCommentPopover for comment creation.
- AnnotationList panel for quick navigation.

## States
- EmptyState for no feeds.
- LoadingSkeleton for card stream.
- ErrorToast for fetch failures.
