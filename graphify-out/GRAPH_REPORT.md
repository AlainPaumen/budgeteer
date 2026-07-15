# Graph Report - .  (2026-07-15)

## Corpus Check
- 175 files · ~78,215 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 958 nodes · 1838 edges · 78 communities (46 shown, 32 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Category & Cost Type Forms
- Sidebar Navigation
- Client App Bootstrap
- Backend Auth & Database
- Shadcn UI Primitives
- User Avatar Components
- Carousel & Media
- Backend Dependencies
- Combobox Components
- Frontend Dependencies
- UI Misc Components
- Backend Package Config
- TypeScript Config
- Shadcn Config
- Design Specs & Docs
- Button Group Components
- TypeScript Config 2
- Delete Dialogs
- SpecKit Bash Scripts
- Better Auth Ecosystem
- Context Menu Components
- Drawer Components
- Speckit Commands
- Eden Treaty API
- API TypeScript Config
- Attachment Components
- Shared TS Config
- Navigation Menu
- Pagination Components
- Empty State Components
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 67
- Community 68
- Community 69
- Community 70
- Community 74
- Community 75
- Community 76

## God Nodes (most connected - your core abstractions)
1. `cn()` - 337 edges
2. `Button()` - 29 edges
3. `compilerOptions` - 18 edges
4. `react` - 17 edges
5. `Input()` - 16 edges
6. `eden` - 14 edges
7. `compilerOptions` - 14 edges
8. `Budgeteer Constitution` - 13 edges
9. `useSidebar()` - 12 edges
10. `FileRoutesByPath` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Speckit Constitution Command` --semantically_similar_to--> `Budgeteer Constitution`  [INFERRED] [semantically similar]
  .opencode/commands/speckit.constitution.md → .specify/memory/constitution.md
- `Email/Password Auth Implementation Plan` --references--> `drizzle-orm`  [EXTRACTED]
  docs/superpowers/plans/2026-07-13-email-password-auth.md → apps/api/package.json
- `Suppliers Feature Implementation Plan` --references--> `drizzle-orm`  [EXTRACTED]
  docs/superpowers/plans/2026-07-14-suppliers-feature.md → apps/api/package.json
- `Email/Password Auth Design Spec` --references--> `drizzle-orm`  [EXTRACTED]
  docs/superpowers/specs/2026-07-13-email-password-auth-design.md → apps/api/package.json
- `Categories Feature Design Spec` --references--> `drizzle-orm`  [EXTRACTED]
  docs/superpowers/specs/2026-07-14-categories-design.md → apps/api/package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Better Auth Authentication Flow** — agents_skills_better_auth_best_practices_better_auth, agents_skills_email_and_password_best_practices_skill, agents_skills_two_factor_authentication_best_practices_skill, agents_skills_organization_best_practices_skill, agents_skills_create_auth_skill, agents_skills_better_auth_security_best_practices_skill [INFERRED 0.85]
- **Specification-to-Implementation Pipeline** — opencode_commands_speckit_specify_command, opencode_commands_speckit_clarify_command, opencode_commands_speckit_plan_command, opencode_commands_speckit_tasks_command, opencode_commands_speckit_implement_command [INFERRED 0.95]
- **Form Validation Patterns** — agents_skills_lukemelnik_agent_skills_tanstack_form_skill, agents_skills_lukemelnik_agent_skills_tanstack_form_tanstack_form, agents_skills_lukemelnik_agent_skills_tanstack_form_zod [EXTRACTED 1.00]
- **Authentication Flow Components** — better_auth, drizzle_adapter, drizzle_orm, eden_treaty, type_bridge [EXTRACTED 0.85]
- **CRUD Feature Pattern** — suppliers_entity, categories_entity, drizzle_orm, eden_treaty, tanstack_suite, shadcn_ui [INFERRED 0.85]
- **Frontend Technology Stack** — tanstack_suite, shadcn_ui, type_bridge, eden_treaty [EXTRACTED 0.95]

## Communities (78 total, 32 thin omitted)

### Community 0 - "Category & Cost Type Forms"
Cohesion: 0.05
Nodes (74): Category, CategoryFormDialog(), CategoryFormDialogProps, categorySchema, FormValues, CostType, CostTypeFormDialog(), CostTypeFormDialogProps (+66 more)

### Community 1 - "Sidebar Navigation"
Cohesion: 0.05
Nodes (56): AppSidebar(), data, NavProjects(), NavSecondary(), NavUser(), SearchForm(), SiteHeader(), Breadcrumb() (+48 more)

### Community 2 - "Client App Bootstrap"
Cohesion: 0.06
Nodes (36): Label(), authClient, queryClient, Register, router, @tanstack/react-router, Route, Route (+28 more)

### Community 3 - "Backend Auth & Database"
Cohesion: 0.07
Nodes (35): auth, TRUSTED_ORIGINS, db, sqlite, account, accountRelations, categories, categoryRelations (+27 more)

### Community 4 - "Shadcn UI Primitives"
Cohesion: 0.08
Nodes (34): Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), InputOTP(), InputOTPGroup(), InputOTPSlot(), Kbd() (+26 more)

### Community 5 - "User Avatar Components"
Cohesion: 0.08
Nodes (32): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), DropdownMenu(), DropdownMenuCheckboxItem() (+24 more)

### Community 6 - "Carousel & Media"
Cohesion: 0.07
Nodes (34): react, Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext() (+26 more)

### Community 7 - "Backend Dependencies"
Cohesion: 0.06
Nodes (34): api, @better-auth/drizzle-adapter, better-sqlite3, @biomejs/biome, bun-types, husky, lint-staged, dependencies (+26 more)

### Community 8 - "Combobox Components"
Cohesion: 0.07
Nodes (30): ComboboxChip(), ComboboxChips(), ComboboxChipsInput(), ComboboxClear(), ComboboxContent(), ComboboxEmpty(), ComboboxGroup(), ComboboxInput() (+22 more)

### Community 9 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (26): devDependencies, tailwindcss, @tailwindcss/vite, @tanstack/router-vite-plugin, @types/react, @types/react-dom, typescript, vite (+18 more)

### Community 10 - "UI Misc Components"
Cohesion: 0.08
Nodes (13): AspectRatio(), Badge(), badgeVariants, HoverCardContent(), NativeSelect(), NativeSelectOptGroup(), NativeSelectOption(), NativeSelectProps (+5 more)

### Community 11 - "Backend Package Config"
Cohesion: 0.08
Nodes (23): dependencies, drizzle-orm, elysia, @elysiajs/cors, @my-app/api-types, zod, devDependencies, drizzle-kit (+15 more)

### Community 12 - "TypeScript Config"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+15 more)

### Community 13 - "Shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 14 - "Design Specs & Docs"
Cohesion: 0.19
Nodes (21): Better Auth, Bun-Only Constraint, Categories Entity, Email/Password Auth Implementation Plan, Login Form Rebuild Implementation Plan, Suppliers Feature Implementation Plan, Auth Login Route Design Spec, Email/Password Auth Design Spec (+13 more)

### Community 15 - "Button Group Components"
Cohesion: 0.13
Nodes (17): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Item(), ItemActions(), ItemContent(), ItemDescription() (+9 more)

### Community 16 - "TypeScript Config 2"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 17 - "Delete Dialogs"
Cohesion: 0.20
Nodes (14): DeleteServiceDialog(), DeleteServiceDialogProps, DeleteSupplierDialog(), DeleteSupplierDialogProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+6 more)

### Community 18 - "SpecKit Bash Scripts"
Cohesion: 0.13
Nodes (5): get_feature_paths(), get_repo_root(), _persist_feature_json(), resolve_specify_init_dir(), common.sh script

### Community 19 - "Better Auth Ecosystem"
Cohesion: 0.23
Nodes (16): Better Auth, Better Auth React Client, Drizzle Adapter, Organization Plugin, Better Auth Best Practices Skill, Two-Factor Plugin, Security Checklist, Better Auth Security Best Practices Skill (+8 more)

### Community 20 - "Context Menu Components"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubTrigger() (+1 more)

### Community 21 - "Drawer Components"
Cohesion: 0.15
Nodes (10): DrawerContent(), DrawerContext, DrawerContextProps, DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerSwipeHandle() (+2 more)

### Community 22 - "Speckit Commands"
Cohesion: 0.35
Nodes (14): Speckit Analyze Command, Speckit Checklist Command, Speckit Clarify Command, Speckit Constitution Command, Speckit Converge Command, Speckit Implement Command, Speckit Plan Command, Speckit Specify Command (+6 more)

### Community 23 - "Eden Treaty API"
Cohesion: 0.15
Nodes (12): @elysiajs/eden, dependencies, elysia, @elysiajs/eden, exports, elysia, main, name (+4 more)

### Community 24 - "API TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, types (+3 more)

### Community 25 - "Attachment Components"
Cohesion: 0.20
Nodes (11): Attachment(), AttachmentAction(), AttachmentActions(), AttachmentContent(), AttachmentDescription(), AttachmentGroup(), AttachmentMedia(), attachmentMediaVariants (+3 more)

### Community 26 - "Shared TS Config"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, module, moduleResolution, noEmit, skipLibCheck, strict, target (+2 more)

### Community 27 - "Navigation Menu"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuPositioner(), NavigationMenuTrigger() (+1 more)

### Community 28 - "Pagination Components"
Cohesion: 0.22
Nodes (7): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 29 - "Empty State Components"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): dependencies, @base-ui/react, @shadcn/react, tailwind-merge, @base-ui/react, @shadcn/react, tailwind-merge

### Community 31 - "Community 31"
Cohesion: 0.38
Nodes (6): Bubble(), BubbleContent(), BubbleGroup(), BubbleReactions(), bubbleReactionsVariants, bubbleVariants

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (5): MessageScroller(), MessageScrollerButton(), MessageScrollerContent(), MessageScrollerItem(), MessageScrollerViewport()

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (5): Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 36 - "Community 36"
Cohesion: 0.60
Nodes (5): Budgeteer App Entry Point, Monorepo Architecture, README, Technology Stack, Workspace Structure

### Community 37 - "Community 37"
Cohesion: 0.50
Nodes (4): Marker(), MarkerContent(), MarkerIcon(), markerVariants

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (5): Checklist Template, Plan Template, Spec Template, Tasks Template, Speckit Full SDD Workflow

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): plugin, $schema, superpowers@git+https://github.com/obra/superpowers.git

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

## Knowledge Gaps
- **271 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `check-prerequisites.sh script`, `common.sh script`, `create-new-feature.sh script` (+266 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Shadcn UI Primitives` to `Category & Cost Type Forms`, `Sidebar Navigation`, `Client App Bootstrap`, `User Avatar Components`, `Carousel & Media`, `Combobox Components`, `UI Misc Components`, `Button Group Components`, `Delete Dialogs`, `Context Menu Components`, `Drawer Components`, `Attachment Components`, `Navigation Menu`, `Pagination Components`, `Empty State Components`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 37`?**
  _High betweenness centrality (0.369) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 30` to `Carousel & Media`, `Frontend Dependencies`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `react` connect `Carousel & Media` to `Category & Cost Type Forms`, `Sidebar Navigation`, `Shadcn UI Primitives`, `Drawer Components`, `Community 30`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `$schema`, `.opencode/plugins/graphify.js`, `check-prerequisites.sh script` to the rest of the system?**
  _271 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Category & Cost Type Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.05414488424197162 - nodes in this community are weakly interconnected._
- **Should `Sidebar Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.05157894736842105 - nodes in this community are weakly interconnected._
- **Should `Client App Bootstrap` be split into smaller, more focused modules?**
  _Cohesion score 0.05795918367346939 - nodes in this community are weakly interconnected._