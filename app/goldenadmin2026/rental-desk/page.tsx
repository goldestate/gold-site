import { listMatchesWithListings, listRentalListings, listRentalRequests, type MatchWithListing } from '@/lib/rental-desk-store';
import { RentalDeskListingsTable } from '@/components/admin/rental-desk-listings-table';
import { RentalDeskRequestsPanel } from '@/components/admin/rental-desk-requests-panel';
import { readNdaIndex, type NdaAgreement } from '@/lib/nda-store';
import type { NdaSummary } from '@/components/admin/nda-badge';
import { LogoutButton } from '@/components/admin/logout-button';
import { AdminNav } from '@/components/admin/admin-nav';
import { CollapsibleSection } from '@/components/admin/collapsible-section';

function groupMatchesByRequest(matches: MatchWithListing[]): Record<string, MatchWithListing[]> {
  const grouped: Record<string, MatchWithListing[]> = {};
  for (const match of matches) {
    (grouped[match.requestId] ??= []).push(match);
  }
  return grouped;
}

function summarize(byId: Record<string, NdaAgreement>): Record<string, NdaSummary> {
  return Object.fromEntries(
    Object.entries(byId).map(([id, nda]) => [id, { id: nda.id, status: nda.status, token: nda.token }])
  );
}

export default async function AdminRentalDeskPage() {
  const [requests, listings, matches, ndaIndex] = await Promise.all([
    listRentalRequests(),
    listRentalListings(),
    listMatchesWithListings(),
    // Optional: before migration 007 there are no agreements, and the page
    // shows every submission as "No NDA" rather than failing.
    readNdaIndex().catch((error) => {
      console.error('Could not read the agreements', error);
      return { byRequest: {}, byListing: {} };
    })
  ]);
  const ndasByRequest = summarize(ndaIndex.byRequest);
  const ndasByListing = summarize(ndaIndex.byListing);

  const matchesByRequest = groupMatchesByRequest(matches);
  const pendingReviewCount = listings.filter((listing) => listing.status === 'pending_review').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <AdminNav current="rental-desk" />
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">Rental Desk</h1>
        </div>
        <LogoutButton />
      </div>

      <CollapsibleSection
        id="rental-desk-listings"
        title="Listings"
        count={listings.length}
        badge={
          pendingReviewCount > 0 ? (
            <span className="rounded-full bg-[rgba(217,179,85,0.18)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#D9B355]">
              {pendingReviewCount} pending review
            </span>
          ) : null
        }
      >
        <p className="mt-2 max-w-xl text-sm text-white/55">
          New listings arrive as &ldquo;Pending review&rdquo;. Approve one to &ldquo;Active&rdquo; to start matching it
          against open requests.
        </p>
        <div className="mt-5">
          <RentalDeskListingsTable listings={listings} ndas={ndasByListing} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="rental-desk-requests" title="Rental Requests" count={requests.length}>
        <p className="mt-2 max-w-xl text-sm text-white/55">
          Each request lists its best-scoring matches. Marking a match &ldquo;sent&rdquo; records that the broker was
          notified.
        </p>
        <div className="mt-5">
          <RentalDeskRequestsPanel requests={requests} matchesByRequest={matchesByRequest} ndas={ndasByRequest} />
        </div>
      </CollapsibleSection>
    </div>
  );
}
