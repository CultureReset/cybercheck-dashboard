import { notFound } from "next/navigation";
import { ProfileRenderer } from "../../components/profile-renderer";
import { getPublishedProfile } from "../../lib/profile";

export default async function PublicProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublishedProfile(slug);
  if (!data) notFound();
  return <ProfileRenderer {...data} />;
}
