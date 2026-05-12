import ClientPage from "./client-page";

export function generateStaticParams() {
  return [];
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}