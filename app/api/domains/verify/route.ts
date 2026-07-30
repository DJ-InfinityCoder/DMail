import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface DnsAnswer {
  name: string;
  type: number;
  data: string;
  TTL: number;
}

interface DohResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

async function queryDns(
  domain: string,
  type: "MX" | "TXT"
): Promise<DnsAnswer[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
    domain
  )}&type=${type}`;

  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
  });

  if (!res.ok) return [];

  const data: DohResponse = await res.json();
  return data.Answer ?? [];
}

function checkMx(answers: DnsAnswer[]): "valid" | "invalid" {
  // Check if any MX record points to a mail handler
  return answers.some((a) => a.type === 15) ? "valid" : "invalid";
}

function checkSpf(answers: DnsAnswer[], domain: string): "valid" | "invalid" {
  // Look for SPF record in TXT records
  return answers.some(
    (a) =>
      a.type === 16 &&
      a.data.toLowerCase().includes("v=spf1")
  )
    ? "valid"
    : "invalid";
}

function checkDmarc(answers: DnsAnswer[]): "valid" | "invalid" {
  return answers.some(
    (a) =>
      a.type === 16 &&
      a.data.toLowerCase().includes("v=dmarc1")
  )
    ? "valid"
    : "invalid";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domainId } = await request.json();

  if (!domainId) {
    return NextResponse.json(
      { error: "domainId is required" },
      { status: 400 }
    );
  }

  // Fetch domain
  const { data: domain, error: fetchError } = await supabase
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .single();

  if (fetchError || !domain) {
    return NextResponse.json(
      { error: "Domain not found" },
      { status: 404 }
    );
  }

  // Verify ownership
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", domain.org_id)
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Run DNS checks
  const [mxAnswers, spfAnswers, dmarcAnswers] = await Promise.all([
    queryDns(domain.domain_name, "MX"),
    queryDns(domain.domain_name, "TXT"),
    queryDns(`_dmarc.${domain.domain_name}`, "TXT"),
  ]);

  const mxStatus = checkMx(mxAnswers);
  const spfStatus = checkSpf(spfAnswers, domain.domain_name);
  const dmarcStatus = checkDmarc(dmarcAnswers);

  // DKIM — check for default selector
  const dkimAnswers = await queryDns(
    `default._domainkey.${domain.domain_name}`,
    "TXT"
  );
  const dkimStatus = dkimAnswers.some(
    (a) => a.type === 16 && a.data.toLowerCase().includes("v=dkim1")
  )
    ? "valid"
    : "invalid";

  // Determine if sending should be enabled
  const sendEnabled =
    mxStatus === "valid" && spfStatus === "valid";

  const isVerified =
    mxStatus === "valid" &&
    spfStatus === "valid" &&
    dmarcStatus === "valid";

  // Update domain record
  const { error: updateError } = await supabase
    .from("domains")
    .update({
      mx_status: mxStatus,
      spf_status: spfStatus,
      dkim_status: dkimStatus,
      dmarc_status: dmarcStatus,
      send_enabled: sendEnabled,
      is_verified: isVerified,
      last_dns_check_at: new Date().toISOString(),
    })
    .eq("id", domainId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mx_status: mxStatus,
    spf_status: spfStatus,
    dkim_status: dkimStatus,
    dmarc_status: dmarcStatus,
    send_enabled: sendEnabled,
    is_verified: isVerified,
  });
}
