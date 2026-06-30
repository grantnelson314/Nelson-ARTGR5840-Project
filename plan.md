# SubTrack — Subscription Tracker Feature Plan

## Project Status

This project is already initialized as a **vanilla HTML, CSS, and JavaScript** web app. Do **not** restart the project, do **not** convert it to React, and do **not** replace the current structure.

Current project files:

- `index.html` — contains the main single-page app screens and layout.
- `app.js` — contains app state, subscription data, localStorage, navigation, forms, dashboard calculations, charts, calendar, and event listeners.
- `styles.css` — contains custom styles that supplement Tailwind and follow the design system.
- `DESIGN.md` — contains the visual style, screen goals, colors, typography, and layout rules.

The goal of this phase is to develop and polish **2–3 core features** for the course project while matching the earlier sketches and the existing `DESIGN.md`.

---

## Design System

A `DESIGN.md` file is already included in this project folder. Follow it closely.

### Required design direction

- Keep the app clean, modern, and dashboard-focused.
- Use the existing blue, slate, green, orange, and light gray design tokens.
- Use Inter as the main font.
- Keep the interface mobile-first and responsive.
- Use white cards on light backgrounds.
- Keep the dashboard gradient only on the Dashboard screen.
- Use clear visual hierarchy for spending totals, renewal dates, and subscription status.
- Do not introduce a new visual style that conflicts with the current app.

### Existing visual patterns to preserve

- Sidebar navigation on desktop.
- Bottom navigation on mobile.
- Rounded white cards with subtle borders and shadows.
- Blue primary buttons.
- Status badges for Active, Paused, and Cancelled.
- Orange warning treatment for urgent renewals.
- Chart-driven analytics.
- Card-based subscription lists.

---

## Core Features to Develop and Polish

Develop and polish the following **three core features**.

---

# Feature 1: Subscription Management

## Purpose

Allow users to add, edit, view, pause, resume, delete, search, filter, and sort subscriptions.

This is the most important feature because the rest of the app depends on accurate subscription data.

## Related Screens

- My Subscriptions
- Add Subscription
- Subscription Detail
- Dashboard
- Analytics
- Renewals

## Page Elements

```
* My Subscriptions Screen
  * Section: Search and Filters #sectionSubscriptionFilters
    * Search input
    * Category filter
    * Status filter
    * Sort dropdown
  * Section: Subscription List #sectionSubscriptionList
    * Subscription cards
    * Service name
    * Category
    * Monthly cost
    * Renewal date
    * Status badge
  * Button: "Add Subscription"

* Add Subscription Screen
  * Form: Subscription Form #sectionSubscriptionForm
    * Service name input
    * Category dropdown
    * Cost input
    * Billing cycle selector
    * Renewal date picker
  * Button: "Save Subscription"
  * Button: "Cancel"

* Subscription Detail Screen
  * Section: Subscription Details #sectionSubscriptionDetails
    * Service name
    * Category
    * Cost
    * Monthly equivalent
    * Billing cycle
    * Next renewal
    * Status
  * Button: "Edit"
  * Button: "Pause" or "Resume"
  * Button: "Delete"
```

## Userflow 1: Add a Subscription

```
* START: User is on Dashboard or My Subscriptions.
* User clicks "Add Subscription".
* System opens the Add Subscription screen.
* User enters service name, category, cost, billing cycle, and renewal date.
* User clicks "Save Subscription".
* System validates the form.
* If the form is valid:
  * System saves the subscription to localStorage.
  * System returns the user to the previous screen.
  * System shows a success toast.
  * Dashboard, Analytics, and Renewals update automatically.
* If the form is invalid:
  * System shows clear field-level error messages.
* END.
```

## Userflow 2: Edit a Subscription

```
* START: User is on My Subscriptions, Dashboard, Renewals, or Analytics.
* User clicks a subscription card.
* System opens the Subscription Detail screen.
* User clicks "Edit".
* System opens the Add Subscription screen with the existing information pre-filled.
* User updates one or more fields.
* User clicks "Save Changes".
* System validates the form.
* System saves the updated subscription to localStorage.
* System returns the user to the Subscription Detail screen or previous list screen.
* Dashboard, Analytics, and Renewals update automatically.
* END.
```

## Userflow 3: Pause, Resume, or Delete a Subscription

```
* START: User is on the Subscription Detail screen.
* User clicks "Pause" on an active subscription.
* System changes the status to Paused and removes it from active spending totals.
* User clicks "Resume" on a paused subscription.
* System changes the status back to Active and includes it in active spending totals.
* User clicks "Delete".
* System asks for confirmation before deleting.
* If confirmed, system removes the subscription from localStorage and returns to My Subscriptions.
* END.
```

## Implementation Notes

- Store subscriptions in `localStorage` using the existing storage key.
- Each subscription should include:

```js
{
  id: string,
  serviceName: string,
  category: "streaming" | "software" | "music" | "fitness" | "news" | "other",
  cost: number,
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly",
  renewalDate: "YYYY-MM-DD",
  status: "active" | "paused" | "cancelled",
  createdAt: string
}
```

- Make sure paused and cancelled subscriptions do not count toward active monthly spend.
- Keep search, filter, and sort controls working together.
- Keep empty states friendly and useful.
- Make cards keyboard accessible when possible.
- Use the existing badge styles and button styles instead of creating unrelated styles.

## Acceptance Criteria

- User can add a new subscription.
- User can edit an existing subscription.
- User can pause and resume an active subscription.
- User can delete a subscription with confirmation.
- User can search by service name.
- User can filter by category and status.
- User can sort by renewal date, cost, and name.
- Empty states appear when no subscriptions exist or no search results match.
- Data stays saved after refreshing the page.

---

# Feature 2: Spending Dashboard and Analytics

## Purpose

Give users a fast overview of how much they spend on subscriptions and help them understand which categories cost the most.

## Related Screens

- Dashboard
- Analytics
- My Subscriptions

## Page Elements

```
* Dashboard Screen
  * Section: Spending Hero #sectionSpendingHero
    * Total monthly spend
    * Projected yearly spend
    * Daily spending equivalent
    * Active subscription count
  * Section: Supporting Metrics #sectionSupportingMetrics
    * Average cost per service
    * Renewals this week
    * Top category
    * Next renewal
  * Section: Category Breakdown #sectionCategoryBreakdown
    * Horizontal category bars
    * Monthly total by category
    * Percent of total spend
  * Section: Upcoming Renewals #sectionUpcomingRenewals
    * Upcoming renewal cards
  * Section: Recent Subscriptions #sectionRecentSubscriptions
    * Recent subscription cards

* Analytics Screen
  * Section: Spending Over Time #sectionSpendingOverTime
    * Line chart or bar chart using Chart.js
  * Section: Category Chart #sectionCategoryChart
    * Doughnut or bar chart using Chart.js
  * Section: Monthly Summary #sectionMonthlySummary
    * Monthly spend
    * Active subscription count
  * Section: Yearly Summary #sectionYearlySummary
    * Projected yearly spend
```

## Userflow 4: Review Spending Overview

```
* START: User opens the app on the Dashboard.
* System loads saved subscriptions from localStorage.
* System calculates total monthly spend from active subscriptions.
* System calculates yearly spend, daily equivalent, average cost, top category, and upcoming renewals.
* User reviews the hero card and supporting metrics.
* User clicks "Full analytics" to see charts.
* System navigates to Analytics.
* User reviews spending over time and category breakdown.
* END.
```

## Calculation Rules

Use the existing monthly equivalent rules:

```js
weekly = cost * (52 / 12)
monthly = cost
quarterly = cost / 3
yearly = cost / 12
```

Use active subscriptions only for:

- Monthly spend
- Yearly spend
- Average cost per service
- Category totals
- Upcoming renewals
- Charts

Paused and cancelled subscriptions should remain visible in the app, but they should not be included in active spending totals.

## Analytics Chart Requirements

- Use Chart.js because it is already included.
- Do not add a new chart library.
- Charts should use colors that match the design system.
- Charts should update when subscriptions are added, edited, paused, resumed, or deleted.
- Charts should support empty states when there is no active subscription data.
- Keep chart labels short and easy to read on mobile.

## Polish Details

- Make the Dashboard hero visually match the original sketch and `DESIGN.md`.
- Keep the main spending number large and easy to scan.
- Keep supporting metric cards consistent in height and spacing.
- Make category bars readable and not too cluttered.
- Make Analytics feel like a natural extension of the Dashboard.
- Add helpful microcopy such as:
  - "Projected annual spend"
  - "Based on active subscriptions"
  - "No active subscriptions yet"

## Acceptance Criteria

- Dashboard totals update correctly.
- Dashboard shows monthly, yearly, daily, and average spending.
- Dashboard shows active subscription count.
- Dashboard shows top category.
- Dashboard shows next renewal.
- Analytics charts render correctly.
- Analytics charts update when subscription data changes.
- Empty states appear when there is no data.
- Layout works on mobile and desktop.

---

# Feature 3: Renewal Tracking and Reminder Settings

## Purpose

Help users see which subscriptions are renewing soon so they can avoid surprise charges.

## Related Screens

- Renewals
- Dashboard
- Subscription Detail

## Page Elements

```
* Renewals Screen
  * Section: Renewal Calendar #sectionRenewalCalendar
    * Monthly calendar grid
    * Dot indicators on days with renewals
    * Selected day details
  * Section: Renewal Timeline #sectionRenewalTimeline
    * Upcoming renewal list
    * Days until renewal
    * Cost
    * Subscription category icon
  * Section: Reminder Settings #sectionReminderSettings
    * Checkbox: 3 days before renewal
    * Checkbox: 1 day before renewal
    * Checkbox: Day of renewal
```

## Userflow 5: View Upcoming Renewals

```
* START: User opens the Renewals screen.
* System shows the current month calendar.
* Days with renewals display a small visual indicator.
* User clicks a day with a renewal.
* System shows subscriptions renewing on that day.
* User clicks a renewal card.
* System opens the Subscription Detail screen.
* END.
```

## Userflow 6: Change Reminder Settings

```
* START: User opens the Renewals screen.
* User checks or unchecks reminder settings.
* System saves the reminder preferences to localStorage.
* System shows a toast confirming the change.
* Reminder settings stay saved after page refresh.
* END.
```

## Implementation Notes

- This project does not need to send real notifications.
- Reminder settings should be saved as preferences only.
- Use localStorage for reminder settings.
- Use visual warning styles for renewals happening in 0–3 days.
- Renewal timeline should sort subscriptions by soonest renewal date.
- Renewal cards should link to the Subscription Detail screen.

## Polish Details

- Make the calendar easy to scan on mobile.
- Keep day cells large enough to tap.
- Use orange styling for urgent renewals.
- Keep the timeline visually connected with dots or a vertical line.
- Include helpful labels such as:
  - "Today"
  - "Tomorrow"
  - "3 days"
  - "No upcoming renewals"

## Acceptance Criteria

- Calendar shows the current month.
- User can navigate to previous and next months.
- Renewal days are marked.
- Clicking a renewal day shows related subscriptions.
- Renewal timeline is sorted by date.
- Reminder settings are saved.
- Urgent renewals are visually highlighted.

---

## Navigation Structure

This is a single-page app with screen-based navigation.

```
Dashboard
My Subscriptions
Analytics
Renewals
Add Subscription
Subscription Detail
```

### Desktop Navigation

- Left sidebar
- Main links:
  - Dashboard
  - My Subscriptions
  - Analytics
  - Renewals
- Add Subscription button in the sidebar and page headers

### Mobile Navigation

- Sticky mobile header
- Bottom navigation for main screens
- Floating add button in the mobile header
- Hide mobile header and bottom navigation on Add Subscription and Subscription Detail screens

---

## Data Storage

Use browser localStorage only.

No backend, database, login, or account system is required for this version.

### localStorage keys

```js
subtrack_subscriptions
subtrack_reminders
```

### Seed Data

Mock subscription data is allowed and useful for the first app load.

Seed data should include examples like:

- Netflix
- Spotify
- Adobe Creative Cloud
- Disney+
- Planet Fitness
- The New York Times
- Microsoft 365

Seed data should use future renewal dates based on the current date so the dashboard and calendar always have useful demo content.

---

## Error, Empty, Loading, and Success States

Even though this app uses localStorage and does not need a real loading spinner, it should still show clear states.

### Empty States

Use empty states when:

- No subscriptions exist.
- No subscriptions match filters.
- No renewals exist for the selected day.
- No active subscriptions exist for analytics.

### Error States

Use field-level form errors when:

- Service name is blank.
- Category is not selected.
- Cost is blank, zero, negative, or invalid.
- Billing cycle is not selected.
- Renewal date is blank.

### Success States

Use toast messages when:

- Subscription is added.
- Subscription is updated.
- Subscription is paused.
- Subscription is resumed.
- Subscription is deleted.
- Reminder settings are saved.

### Loading State

Because the app is local-only, loading can be minimal. If desired, add a very short skeleton or message while initializing, but it is not required.

---

## Accessibility Requirements

- Use buttons for clickable cards.
- Add meaningful `aria-label` values where helpful.
- Keep visible focus states.
- Keep color contrast accessible.
- Do not rely on color alone for status.
- Keep tap targets large enough on mobile.
- Form errors should be clear and close to the related input.
- Inputs should have labels.

---

## Responsive Requirements

### Mobile

- One-column layout.
- Bottom navigation.
- Large tap targets.
- Cards stacked vertically.
- Calendar should fit the screen without horizontal scrolling.
- Forms should be easy to complete on a phone.

### Tablet

- Two-column card grids where appropriate.
- Dashboard cards can start to sit side by side.

### Desktop

- Sidebar navigation.
- Wider dashboard grid.
- Charts and summaries can appear in two-column layouts.
- Main content should stay centered and not stretch too wide.

---

## Implementation Checklist

Use this checklist while developing.

### Subscription Management

- [ ] Add subscription form works.
- [ ] Edit subscription form works.
- [ ] Delete confirmation works.
- [ ] Pause and resume works.
- [ ] Search works.
- [ ] Category filter works.
- [ ] Status filter works.
- [ ] Sort dropdown works.
- [ ] Empty state works.
- [ ] Data persists after refresh.

### Dashboard and Analytics

- [ ] Monthly spend is correct.
- [ ] Yearly spend is correct.
- [ ] Daily equivalent is correct.
- [ ] Active count is correct.
- [ ] Average cost per service is correct.
- [ ] Top category is correct.
- [ ] Next renewal is correct.
- [ ] Category bars render correctly.
- [ ] Spending chart renders correctly.
- [ ] Category chart renders correctly.
- [ ] Empty analytics state works.

### Renewals

- [ ] Calendar renders current month.
- [ ] Previous month button works.
- [ ] Next month button works.
- [ ] Renewal dots appear on correct days.
- [ ] Clicking a day shows renewals.
- [ ] Timeline is sorted by date.
- [ ] Urgent renewals are highlighted.
- [ ] Reminder checkboxes save to localStorage.
- [ ] Reminder settings persist after refresh.

### Polish

- [ ] Dashboard matches `DESIGN.md`.
- [ ] All screens feel visually consistent.
- [ ] Mobile layout is clean.
- [ ] Desktop layout is clean.
- [ ] Buttons, inputs, cards, and badges use existing styles.
- [ ] No unused or broken UI elements.
- [ ] No console errors.
- [ ] App still works after refresh.

---

## Suggested Cursor Prompt

After placing this file in the project folder as `plan.md`, use this prompt in Cursor:

```
Please read DESIGN.md and plan.md first. This project is already built with vanilla HTML, CSS, JavaScript, Tailwind CDN, and Chart.js. Do not convert it to React and do not restart the project.

Please help me finish and polish the 3 core features listed in plan.md:
1. Subscription Management
2. Spending Dashboard and Analytics
3. Renewal Tracking and Reminder Settings

Use the existing files: index.html, app.js, and styles.css. Keep the visual style consistent with DESIGN.md. Match the dashboard-centered card layout from the earlier sketches. Focus on making the app feel complete, responsive, and easy to use. Please also check for bugs, missing empty states, form validation issues, mobile layout issues, and console errors.
```

---

## Optional Stretch Improvements

Only complete these after the core features are working.

- Add a simple export button for subscriptions as JSON or CSV.
- Add a "Reset demo data" button.
- Add a small "potential savings" card for paused or cancelled subscriptions.
- Add a category filter to Analytics.
- Add clearer onboarding text when the app has no subscriptions.
- Add better confirmation messaging before deleting a subscription.
- Add a simple light/dark mode toggle only if it does not conflict with `DESIGN.md`.

---

## Assumptions

- This version will stay as a local-only front-end project.
- Subscription data will be saved in localStorage.
- Real reminder notifications are not required.
- Login, accounts, and a database are not required.
- The current screen-based app structure should be preserved.
- The goal is to polish the course project, not rebuild it from scratch.
