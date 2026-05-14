# Technical Debt

Track known compromises here.

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- Temporary static admin login is not production security.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- Media library may start as URL/manual asset picker until real storage exists.
