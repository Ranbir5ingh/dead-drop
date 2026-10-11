import { ChunkLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div>
      <p className="eyebrow">off the sheet</p>
      <h1>This page is not on the map.</h1>
      <div className="actions">
        <ChunkLink href="/hunt">Back to the riddles</ChunkLink>
      </div>
    </div>
  );
}
