import Form from "next/form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Submits to /search?q=... — works without JavaScript.
export function SearchBar() {
  return (
    <Form action="/search" className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        placeholder="Search by laptop model or part number, e.g. HS04, Inspiron 3521"
        className="pl-9"
      />
    </Form>
  );
}
