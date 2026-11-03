# Build dependency notices

The November 2, 2026 security update includes these build dependencies under
the Blue Oak Model License 1.0.0:

| Package | Version |
| --- | --- |
| glob | 14.0.2 |
| minimatch | 11.0.1 |
| path-scurry | 3.0.0 |
| @isaacs/nonrecursive-glob-match | 1.0.3 |

License text: https://blueoakcouncil.org/license/1.0.0 . When distributing any
part of this software, include that license text or the link. Retain the
packages' supplied license files and other required notices.

glob and minimatch are pinned through npm overrides to address
GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249. The other two entries are required
transitive resolutions in the reviewed lockfile. Codex owns verification of
this scoped update; the project owner retains future dependency/security
update decisions under EYD-ARCH-001.
