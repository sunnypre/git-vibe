\# AntiGravity UX Specification: git-vibe



\## 🛠️ Design System Execution Contract



\### Base Architecture

\* \*\*Library UI Core:\*\* `shadcn/ui` built on top of Radix UI primitives.

\* \*\*Styling Native Engine:\*\* Tailwind CSS v4.

\* \*\*Component Paradigm:\*\* Copy-and-Customize. Direct tailwind configuration modifications must be enforced in the codebase to align with high-density design tokens.



\### Theme \& Global Tokens (`vibeTheme.css`)

```css

:root {

&#x20; --app-bg: #1e1e1e;

&#x20; --panel-bg: #252526;

&#x20; --header-bg: #2d2d2d;

&#x20; --border-subtle: #3e3e3e;

&#x20; 

&#x20; --text-primary: #cccccc;

&#x20; --text-active: #ffffff;

&#x20; --text-muted: #888888;

&#x20; 

&#x20; --accent-active: #007acc; /\* VS Code Blue \*/

&#x20; --git-modified: #4ec9b0;  /\* Teal/Cyan \*/

&#x20; --git-added: #89d185;     /\* Green \*/

&#x20; --git-deleted: #f48771;   /\* Red/Coral \*/

&#x20; 

&#x20; --diff-add-bg: #1e4620;

&#x20; --diff-del-bg: #4b1818;

}



\## Ux overview

+-----------------------------------------------------------------------+

|  \[Tab: Repo A]  \[Tab: Repo B]  \[Tab: Repo C]                          |

+---------------------------------------+-------------------------------+

|                                       |                               |

|                                       |                               |

|  Changes List Panel                   |  Diff Explorer Panel          |

|  (Width: 30%)                         |  (Width: 70%)                 |

|                                       |                               |

|                                       |                               |

|                                       |                               |

+---------------------------------------+-------------------------------+

|  Integrated Terminal Panel                                            |

|  (Height: 30%, Full Width)                                            |

+-----------------------------------------------------------------------+

