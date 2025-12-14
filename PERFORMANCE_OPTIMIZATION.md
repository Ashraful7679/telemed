# Performance Optimization Guide

## Implemented Optimizations

### 1. Fixed Header Component

- Created global `Header` component in `components/layout/Header.tsx`
- Fixed position header for all pages
- Responsive mobile menu
- Role-based navigation (Patient, Doctor, Admin)
- Includes: Home, Appointments, Wallet, Profile links

### 2. Performance Improvements Needed

#### Database Query Optimization

**Current Issues:**

- Multiple sequential queries in loops
- N+1 query problems
- Fetching unnecessary data

**Solutions:**

```typescript
// ❌ Bad: N+1 queries
for (const doctor of doctors) {
  const slots = await supabase
    .from("slots")
    .select("*")
    .eq("doctor_id", doctor.id);
}

// ✅ Good: Single query with joins
const { data } = await supabase.from("doctors").select(`
        *,
        slots:availability_slots(*)
    `);
```

#### Implement React Query / SWR

Install and use for data caching:

```bash
npm install @tanstack/react-query
```

Benefits:

- Automatic caching
- Background refetching
- Reduced API calls
- Faster perceived performance

#### Image Optimization

- Use Next.js Image component (already using)
- Add `priority` prop for above-fold images
- Use appropriate image sizes

#### Code Splitting

- Use dynamic imports for heavy components
- Lazy load appointment room features

```typescript
const AppointmentRoom = dynamic(() => import("./AppointmentRoom"), {
  loading: () => <LoadingSpinner />,
});
```

#### Database Indexes

Ensure indexes on:

- `appointments.patient_id`
- `appointments.doctor_id`
- `appointments.reservation_start_time`
- `prescribed_medicines.appointment_id`
- `transactions.wallet_id`

### 3. Specific Page Optimizations

#### Home Page (`app/page.tsx`)

- Reduce initial doctor fetch limit
- Implement pagination or infinite scroll
- Cache specializations list
- Combine slot availability queries

#### Appointments Pages

- Use select specific columns only
- Implement pagination for past appointments
- Cache frequently accessed data

#### Prescription Page

- Combine all queries into single request with joins
- Cache prescription data

### 4. Next.js Configuration

Add to `next.config.js`:

```javascript
module.exports = {
  images: {
    domains: ["your-supabase-url.supabase.co"],
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### 5. Loading States

- Add skeleton loaders instead of spinners
- Show partial content while loading
- Optimistic UI updates

## Quick Wins

1. **Reduce Query Complexity**: Limit data fetching to what's needed
2. **Add Caching**: Use React Query or SWR
3. **Optimize Images**: Proper sizing and lazy loading
4. **Database Indexes**: Ensure all foreign keys are indexed
5. **Pagination**: Don't load all data at once

## Monitoring

Track performance with:

- Next.js built-in analytics
- Lighthouse scores
- Real User Monitoring (RUM)
