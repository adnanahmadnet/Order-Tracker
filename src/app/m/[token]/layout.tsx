import UrduLayer from "@/components/UrduLayer";

export const dynamic = "force-dynamic";

export default async function MasterLayout({ children, params }: { children: React.ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="master-ui mx-auto w-full max-w-md p-4 md:max-w-3xl md:p-6 xl:max-w-6xl xl:p-8 print:max-w-none print:p-0">
      <UrduLayer token={token}>{children}</UrduLayer>
    </div>
  );
}
