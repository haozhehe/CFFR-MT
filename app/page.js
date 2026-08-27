import db from "./database/database";
import { redirect } from "next/navigation";


export default function Home() {
  redirect("/login/login");
}