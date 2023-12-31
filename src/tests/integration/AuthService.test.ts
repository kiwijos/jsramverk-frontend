import { randomUUID } from "crypto";
import AuthService from "@/services/AuthService";
import { expect, test } from "vitest";

//Assume kent to be a registered user
test("AuthService login success", async () => {
    const result = await AuthService.loginGrapQL("kent", "kent");
    expect(result.success).toBe(true);
});

test("AuthService login fail", async () => {
    const result = await AuthService.loginGrapQL("kent", "kent2");
    expect(result.success).toBe(false);
});

//Create loads of random users, oops
test("AuthService register success", async () => {
    const result = await AuthService.registerGrapQL({
        username: randomUUID(),
        password: randomUUID(),
        email: randomUUID()
    });
    expect(result.success).toBe(true);
});

test("AuthService register fail", async () => {
    const result = await AuthService.registerGrapQL({
        username: "kent",
        password: "kent",
        email: "kent"
    });
    expect(result.success).toBe(false);
});
