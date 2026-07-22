# Spam Filter

Token explorer spam behavior.

- The URL query key is `hide_spam`.
- Missing `hide_spam` means spam is hidden.
- `hide_spam=false` means the user wants spam visible where backend allows it.
- Frontend must not send `moderator_deleted=false` for this control. Soft delete and spam are different backend fields.
- Backend uses `remixes.is_spam` for spam and still hides `moderator_deleted=true` rows from normal public reads.
