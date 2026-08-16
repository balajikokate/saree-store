import { useEffect, useState } from "react";
import { adminWholesaleApi } from "../../services/adminApi";
import Loader from "../../components/common/Loader";

export default function AdminWholesale() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminWholesaleApi
      .list()
      .then((res) => setInquiries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading inquiries" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Wholesale Inquiries</h1>
      <p className="mt-1 text-sm text-ink/60">{inquiries.length} inquiries received</p>

      {inquiries.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No inquiries yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-sm border border-ink/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{inq.name}</p>
                  {inq.businessName && <p className="text-sm text-ink/60">{inq.businessName}</p>}
                </div>
                <p className="text-xs text-ink/40">{new Date(inq.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/70">
                <a href={`mailto:${inq.email}`} className="text-maroon underline">{inq.email}</a>
                <a href={`tel:${inq.phone}`} className="text-maroon underline">{inq.phone}</a>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink/70">{inq.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
