# STYLEVERSE development roadmap

## Completed

- [x] Restore the missing `react-markdown` dependency and get the production build passing.
- [x] Load licensed, rigged female and male fitting models; persist model choice with each design and default older designs to the female model.
- [x] Clone cached skinned model scenes before normalization and hide unrigged garment shells during runway animation.
- [x] Turn the marketplace and inspiration placeholders into searchable, filterable galleries with locally saved pieces and references.
- [x] Validate local workspace records independently and preserve valid designs when individual stored records are malformed.
- [x] Update design timestamps when names and collection assignments change so cloud merge can keep the newest copy.
- [x] Pass the existing regression suite and production build; smoke-check core routes over HTTP.
- [x] Clear project-wide formatting lint errors while leaving auto-generated Supabase clients untouched.

## Remaining

- [ ] Verify garment fit against the rigged bodies. Current garment geometry is not rigged; runway therefore shows only the human model.
- [ ] Exercise save, reopen, refresh, import/export and collection flows in a real browser on desktop and mobile.
- [ ] Verify cloud backup and restore against the connected Supabase environment, including an authenticated session.
- [ ] Review AI brief loading, refusal, copy and long-response behavior in the browser; preserve the raw Responses client and Markdown safety.
- [ ] Improve the studio's initial-load performance. The current studio client chunk is about 1.06 MB before gzip.
- [ ] Decide whether the marketplace remains a lookbook prototype or gains real inventory and checkout; it currently has no purchase flow.
