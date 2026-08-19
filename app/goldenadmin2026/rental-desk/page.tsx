import Link from 'next/link';
import { listMatchesWithListings, listRentalListings, listRentalRequests, type MatchWithListing } from '@/lib/rental-desk-store';
import { RentalDeskListingsTable } from '@/components/admin/rental-desk-listings-table';
import { RentalDeskRequestsPanel } from '@/components/admin/rental-desk-requests-panel';
import { LogoutButton } from '@/components/admin/logout-button';

function groupMatchesByRequest(matches: MatchWithListing[]): Record<string, MatchWithListing[]> {
  const grouped: Record<string, MatchWithListing[]> = {};
  for (const match of matches) {
    (grouped[match.requestId] ??= []).push(match);
  }
  return grouped;
}

export default async function AdminRentalDeskPage() {
  const [requests, listings, matches] = await Promise.all([
    listRentalRequests(),
    listRentalListings(),
    listMatchesWithListings()
  ]);

  const matchesByRequest = groupMatchesByRequest(matches);
  const pendingReviewCount = listings.filter((listing) => listing.status === 'pending_review').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
            <Link href="/goldenadmin2026/properties" className="text-white/40 transition hover:text-[#D9B355]">
              Properties
            </Link>
            <span>Rental Desk</span>
          </div>
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">Rental Desk</h1>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium uppercase tracking-[0.14em] text-white">Listings</h2>
          {pendingReviewCount > 0 ? (
            <span className="rounded-full bg-[rgba(217,179,85,0.18)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#D9B355]">
              {pendingReviewCount} pending review
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-xl text-sm text-white/55">
          New listings arrive as &ldquo;Pending review&rdquo;. Approve one to &ldquo;Active&rdquo; to start matching it
          against open requests.
        </p>
        <div className="mt-5">
          <RentalDeskListingsTable listings={listings} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium uppercase tracking-[0.14em] text-white">Rental Requests</h2>
        <p className="mt-2 max-w-xl text-sm text-white/55">
          Each request lists its best-scoring matches. Marking a match &ldquo;sent&rdquo; records that the broker was
          notified.
        </p>
        <div className="mt-5">
          <RentalDeskRequestsPanel requests={requests} matchesByRequest={matchesByRequest} />
        </div>
      </section>
    </div>
  );
}
