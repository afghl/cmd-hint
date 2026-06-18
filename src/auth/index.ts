import { Command } from "commander";
import { login } from "./login"
import { register } from "../cmd"

function f(auth: Command): void {
    auth.command("login")
        .description("Login placeholder for future pi auth.").action(login)
}

register("auth", f)