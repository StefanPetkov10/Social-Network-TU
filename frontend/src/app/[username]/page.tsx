import ClientPage from "./client-page";

export function generateStaticParams() {
  return [{ username: "dummy_profile_9" }]; 
}

export default function Page({ searchParams, ...props }: any) {
  const ClientComponent: any = ClientPage;
  return <ClientComponent {...props} />;
}