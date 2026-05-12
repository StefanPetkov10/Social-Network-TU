import ClientPage from "./client-page";

export function generateStaticParams() {
  return [{ username: "admin" }]; 
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}