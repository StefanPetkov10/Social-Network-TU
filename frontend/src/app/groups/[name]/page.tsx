import ClientPage from "./client-page";

export function generateStaticParams() {
  return [{ name: "default" }]; 
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}