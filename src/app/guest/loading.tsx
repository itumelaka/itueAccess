import { GuestSelfServiceLayout } from "@/features/guests/guest-self-service-layout";

export default function GuestRegistrationLoading() {
  return (
    <GuestSelfServiceLayout>
      <section
        className="guest-self-service__card guest-self-service__loading"
        aria-busy="true"
      >
        <span className="guest-self-service__spinner" aria-hidden="true" />
        <p className="guest-self-service__kicker">Pendaftaran tetamu</p>
        <h2>Memuatkan lokasi…</h2>
        <p>Proses ini biasanya mengambil beberapa saat.</p>
      </section>
    </GuestSelfServiceLayout>
  );
}