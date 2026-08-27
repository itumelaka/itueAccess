import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  linkProps: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    className,
    href,
    prefetch,
  }: {
    children: ReactNode;
    className?: string;
    href: string;
    prefetch?: boolean;
  }) => {
    mocks.linkProps({ className, href, prefetch });
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  },
}));

import { AdminNav } from "./nav";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("AdminNav", () => {
  it("keeps all seven navigation links unchanged and disables prefetch", () => {
    render(<AdminNav />);

    const expectedLinks = [
      { href: "/admin", label: "ITU eAccess" },
      { href: "/admin", label: "Ringkasan" },
      { href: "/admin/users", label: "Pengguna" },
      { href: "/admin/locations", label: "Lokasi & QR" },
      { href: "/admin/guests", label: "Tetamu" },
      { href: "/admin/history", label: "Sejarah" },
      { href: "/history", label: "Paparan pengguna" },
    ];
    const renderedLinks = screen.getAllByRole("link");

    expect(renderedLinks).toHaveLength(7);
    expect(
      renderedLinks.map((link) => ({
        href: link.getAttribute("href"),
        label: link.textContent?.trim(),
      })),
    ).toEqual(expectedLinks);
    expect(
      mocks.linkProps.mock.calls.map(([props]) => ({
        href: props.href,
        prefetch: props.prefetch,
      })),
    ).toEqual(
      expectedLinks.map(({ href }) => ({ href, prefetch: false })),
    );
    expect(screen.getByRole("navigation", { name: "Navigasi admin" })).toBeTruthy();
  });
});
