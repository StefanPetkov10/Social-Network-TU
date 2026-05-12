import ClientPage from "./client-page";

export function generateStaticParams() {
  return [{ id: "dummy_message_9" }]; 
}

export default function Page({ searchParams, ...props }: any) {
  const ClientComponent: any = ClientPage;
  return <ClientComponent {...props} />;
}