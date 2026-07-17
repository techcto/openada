# Third-party notices

OpenADA uses and links to the following open-source projects. This file is a
convenience notice; the authoritative license text remains with each project
and in the distributed dependency package where applicable.

## axe-core

OpenADA bundles `axe-core` in the API container and uses it without modifying
the library. axe-core is distributed under the Mozilla Public License 2.0.
Retain the upstream license and notices when redistributing an image or source
bundle that contains it. See the [axe-core repository](https://github.com/dequelabs/axe-core)
and its `LICENSE` and `LICENSE-3RD-PARTY.txt` files.

## LanguageTool

OpenADA exposes a LanguageTool-compatible API and can call a separately
managed LanguageTool-compatible upstream. The LanguageTool server is not
bundled in the OpenADA container. The LanguageTool core is distributed under
the GNU Lesser General Public License 2.1 or later. If a deployment bundles
or modifies LanguageTool, distribute the applicable license and source/notices
under the LGPL terms. See the [LanguageTool repository](https://github.com/languagetool-org/languagetool)
and `COPYING.txt`.

## Playwright

Playwright is linked as the open-source browser automation project used by the
OpenADA crawler roadmap. A deployment that adds Playwright must preserve its
Apache License 2.0 notice and any third-party browser/dependency notices. The
current OpenADA fetch path does not bundle Playwright. See the
[Playwright repository](https://github.com/microsoft/playwright) and `LICENSE`.

This notice is not legal advice. Review the exact files shipped in a release
before redistributing a container or derivative product.
