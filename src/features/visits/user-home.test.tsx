import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { UserHome } from "./user-home";

afterEach(cleanup);

describe("UserHome", () => {
  it("shows the admin dashboard link for admins", () => {
    render(
      <UserHome
        active={null}
        displayName="Admin ITU"
        role="ADMIN"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Buka Dashboard Admin" }).getAttribute("href"),
    ).toBe("/admin");
  });

  it("hides the admin dashboard link for normal users", () => {
    render(
      <UserHome
        active={null}
        displayName="Pengguna ITU"
        role="USER"
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Buka Dashboard Admin" }),
    ).toBeNull();
  });
});
