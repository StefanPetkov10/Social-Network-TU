import ClientPage from "./client-page";

export function generateStaticParams() {
  return [{ id: "1" }]; 
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}