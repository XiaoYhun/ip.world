/* eslint-disable react/no-unescaped-entities */
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useRef } from "react"
import { useVerificationForm } from "../form-context"

export default function TermsAndConditionsScreen() {
  const form = useVerificationForm()
  const [hasScrolledFirst, setHasScrolledFirst] = useState(false)
  const [hasScrolledSecond, setHasScrolledSecond] = useState(false)
  const firstScrollRef = useRef<HTMLDivElement>(null)
  const secondScrollRef = useRef<HTMLDivElement>(null)

  const termsLaunchpadAgreed = form.watch("terms_launchpad_agreed")
  const termsPilAgreed = form.watch("terms_pil_agreed")

  const handleFirstScroll = () => {
    const element = firstScrollRef.current
    if (element) {
      const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 5
      if (isAtBottom) {
        setHasScrolledFirst(true)
      }
    }
  }

  const handleSecondScroll = () => {
    const element = secondScrollRef.current
    if (element) {
      const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 5
      if (isAtBottom) {
        setHasScrolledSecond(true)
      }
    }
  }

  const canCheckBoxes = hasScrolledFirst && hasScrolledSecond

  return (
    <div className="max-h-[540px] min-h-[540px] overflow-y-auto rounded-[16px] border bg-neutral-800 p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="font-archivo text-[28px] font-medium">Terms &amp; Conditions</div>
        <div className="font-archivo text-sm leading-relaxed text-neutral-100">
          <span className="font-bold">Important:</span> Upon approval of this verification request, (i) your token will
          be subject to IP World’s Memetic Launchpad Terms, and (ii) a Story Protocol Programmable IP License (PIL) will
          be generated to govern on-chain IP attribution and related token mechanics.
        </div>
      </div>

      <div
        ref={firstScrollRef}
        onScroll={handleFirstScroll}
        className="font-archivo h-[280px] overflow-y-auto rounded-[16px] border bg-neutral-900 p-4 leading-[120%]!"
        style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
      >
        <div className="font-archivo mb-4 text-sm font-semibold">Memetic Launchpad Agreement</div>

        <div className="font-archivo mb-4 text-xs text-neutral-100">
          This Memetic Launchpad Agreement (“Agreement”) is entered into by and between IP WORLD INC., a Cayman Islands
          exempted company (“IP World”), and the IP Licensor (“IP Licensor”) as defined in the Story Programmable IP
          License (“PIL”), a copy of which is linked{" "}
          <a
            className="text-blue-400 hover:text-blue-500"
            href="https://github.com/piplabs/pil-document/blob/main/pil.pdf"
          >
            here
          </a>{" "}
          and incorporated herein (each individually a “Party” and collectively referred to as the “Parties”) and sets
          forth the terms of Parties Agreement commencing as of the date Licensor registers with IP World (“Effective
          Date”). This Agreement allows IP Licensor access to the IP World protocol (“IP World Protocol”), which enables
          users to upload and commercialize their intellectual property via the generation and launch of an Ownership
          Token on the Story blockchain platform (“Story Platform”). In conjunction with this Agreement, IP Licensor
          shall execute the Story PIL.
        </div>

        <div className="font-archivo space-y-6 text-xs leading-[120%]! text-neutral-100">
          <div>
            <div className="mb-2 font-semibold">1. License.</div>
            <div>
              IP Licensor hereby grants to IP World limited, worldwide, royalty-free, fully transferable, and
              sublicensable licensing rights (“Licensing Rights”) to use, exploit, modify, edit, reproduce, adapt,
              combine with other materials, translate, and creative derivative works of any creative work uploaded to
              the IP World Protocol (“Licensed Materials”) in all formats, in connection with launching a token
              (“Token”) on the Story Platform via the IP World Protocol.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">2. Compensation.</div>
            <div className="mt-2 font-semibold">(a) Fee Sharing.</div>
            <div>
              IP Licensor shall be entitled to receive, split via the applicable smart contract, fifty percent (50%) of
              the total trading fees generated in connection with the Token and any registered remix or derivative
              Tokens associated with the Licensed Materials on the Story Platform, with distributions made directly
              through the IP World Protocol’s fee-sharing mechanism. Verification and claiming of fees will be conducted
              by authenticating the Licensed Materials.
            </div>

            <div className="mt-2 font-semibold">(b) Token Allocation.</div>
            <div>
              IP Licensor shall receive a percentage of the Token supply as more fully set forth in the onboarding
              materials and/or applicable smart contract governing the Token, subject to any vesting and lockup schedule
              or other material terms contained therein.
            </div>

            <div className="mt-2 font-semibold">(c) Taxes.</div>
            <div>
              IP Licensor shall be responsible for any taxes based on its revenue and shall indemnify, defend, and hold
              IP World harmless from any liability or expense resulting from its failure to pay any such applicable
              taxes.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">3. Intellectual Property.</div>
            <div>
              IP Licensor hereby retains all right, title and interest, including underlying copyright, trademark, name,
              image, likeness, voice, persona, signature or other indicia of identity (collectively, “NIL”), goodwill
              and other intellectual property rights, in and to the Licensed Materials owned or controlled by IP
              Licensor prior to the Effective Date (“Intellectual Property”), and nothing herein shall be construed as
              an assignment or other transfer of any IP Licensor rights except as otherwise granted herein.
            </div>
            <div className="mt-2">
              IP Licensor hereby knowingly, voluntarily, and irrevocably waives all rights of attribution and integrity
              and any other rights in or to the Licensed Materials arising under Section 106A of the Copyright Act (17
              U.S.C. § 106A), or under any other applicable law of the United States or any other state, country, or
              other jurisdiction that acknowledges or confers rights of the same or similar nature (collectively, “Moral
              Rights”). To the extent this waiver is not permitted by applicable law, IP Licensor hereby agrees not to
              enforce its Moral Rights against IP World and/or IP World’s assignee(s), designee(s), or transferee(s).
            </div>
            <div className="mt-2">
              IP World retains all Intellectual Property and other rights, title and interest in and to all materials
              owned by, licensed to, used or created by IP World prior to, or independent from this Agreement, including
              but not limited to, the IP World Protocol and Intellectual Property created as a result of IP World’s
              independent use or creation and all trademarks, generic or proprietary information, ideas, methodologies,
              software, applications, processes or procedures used, created or developed in the general conduct of its
              business.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">4. Limited Exclusivity.</div>
            <div>
              During the Term, IP Licensor shall not enter into any contractual agreement or binding obligation with any
              other third party regarding the development, generation, deployment, production, distribution, promotion,
              or exploitation of any Token which is based upon the Licensed Materials.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">5. Term; Termination of Access.</div>
            <div>
              This Agreement begins on the Effective Date and continues so long as fees are generated in connection with
              the Token or until terminated pursuant to this Section 5 (“Term”). IP World may terminate this Agreement
              and access to the IP World Protocol: (a) for any reason with thirty (30) days written notice (email to be
              sufficient); (b) immediately, if in IP World’s sole determination, IP Licensor lacks proper authority to
              grant the licenses contained herein or commits any act or becomes involved in any situation or occurrence
              which brings disrepute, contempt, scandal, or ridicule, or which justifiably shocks, insults or offends a
              portion of the community; (c) if the IP Licensor becomes insolvent, makes a general assignment for the
              benefit of creditors, becomes subject to any proceedings under any bankruptcy or insolvency law or ceases
              to do business in the normal course; or (d) pursuant to the terms of the current Story Terms of Service,
              PIL and/or the IP World Terms of Service.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">6. Effect of Termination.</div>
            <div>
              Upon any termination or expiration of this Agreement: (a) all Licensing Rights for all Licensed Materials
              shall immediately terminate (except as otherwise set forth herein or to the extent that IP World is
              required to fulfill an obligation under this Agreement); and (b) IP Licensor shall immediately cease use,
              sale, marketing or exploitation of any Token, provided, however, that IP World shall have the sole option,
              in its discretion, to maintain access to the use, sale marketing or other exploitation of any Token
              following such termination or expiration, subject to the terms and conditions of this Agreement, which
              shall survive solely for such purpose.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">7. Confidentiality.</div>
            <div>
              IP Licensor will treat as confidential and properly safeguard any and all information, software,
              technology, documents, papers, programs and ideas relating to the IP World, its operations, services,
              finances and products, disclosed to the IP Licensor or which should be reasonably understood to be
              confidential (“Confidential Information”).
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">8. Representations and Warranties.</div>
            <div>
              The IP Licensor hereby represents, warrants, and agrees that: (a) it has the right to enter into this
              Agreement, including to grant the licenses herein, and no provisions, services or grant of rights
              hereunder does now or will hereafter violate, conflict with or infringe upon any rights whatsoever
              (including, without limitation, any intellectual property right, any right against libel, slander or
              invasion of privacy or any unfair competition or similar right) of any person, firm or corporation; (b)
              all Licensed Materials licensed to IP World in connection with this Agreement are solely and exclusively
              owned by IP Licensor or IP Licensor otherwise has the right to grant such license; and (c) it will comply
              with all applicable laws, regulations and policies applicable to the services provided and rights granted
              under this Agreement, including but not limited to, any underlying license required by the Story Platform
              as well as the IP World Protocol Terms of Service, which are hereby incorporated hereto and linked{" "}
              <a className="text-blue-400 hover:text-blue-500" href="https://ip.world/terms-of-service">
                here
              </a>{" "}
              and the Story Platform Terms of Use linked{" "}
              <a className="text-blue-400 hover:text-blue-500" href="https://www.story.foundation/terms">
                here
              </a>{" "}
              .
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">9. Indemnity; Limited Liability.</div>
            <div>
              (a) Indemnity. IP Licensor agrees to indemnify and hold IP World, and its successors, licensees and
              assigns, and all of its respective owners, directors, officers, employees and representatives, harmless
              from and against any and all liabilities, judgments, damages, penalties, losses, costs and expenses
              (including reasonable outside attorneys’ fees and legal costs), including any interest thereon, arising
              out of or in connection with any claim or demand regarding any breach of any warranty, representation or
              agreement made by IP Licensor hereunder, including any claim for infringement of the Licensed Materials.
              IP World shall notify IP Licensor of any such claim, demand, or action after being has been formally
              advised thereof, and IP Licensor shall have the right, at IP Licensor’s expense, to participate in the
              defense thereof with counsel of IP Licensor’s choice, provided that IP World shall have the right at all
              times, in its sole discretion, to retain control, or resume control, of the conduct of said defense.
            </div>
            <div className="mt-2">
              (b) Limitation of Liability. IP WORLD WILL NOT BE LIABLE FOR LOST REVENUE, LOST PROFITS, LOST BUSINESS, OR
              INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL OR EXEMPLARY DAMAGES (EVEN IF ADVISED OF THE POSSIBILITY OF
              SUCH DAMAGES).
            </div>
            <div className="mt-2">
              (c) IP Licensor agrees that any claim, dispute, or controversy arising out of or relating to this
              Agreement shall be brought solely on an individual basis, and not as a plaintiff or class member in any
              purported class, collective, consolidated, representative, or mass action. No arbitrator or court shall
              have authority to hear or preside over any such class or representative proceeding, and IP Licensor
              expressly waives any right to participate in or seek relief through any class, collective, or
              representative action.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">10. Notices.</div>
            <div>
              Unless stated otherwise herein, any notice or other communication required or permitted by this Agreement
              shall be in writing and shall be: (a) delivered personally or by commercial messenger or courier service;
              or (b) mailed by U.S. registered or certified mail (return receipt requested) at the address written
              herein or at such other address as IP World or IP Licensor may have previously specified by like notice.
              Notice is effective upon receipt.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">11. Dispute Resolution.</div>
            <div>
              This Agreement is governed by the laws of the Cayman Islands (without regard to any conflicts of law
              provisions). Any and all controversies or disputes arising out of or relating to this Agreement shall be
              determined pursuant to the mediation and arbitration procedures of the International Centre for Dispute
              Resolution in accordance with their mediation or arbitration rules, as applicable. The Parties shall
              endeavor first to attempt to resolve the controversy or claim through mediation within sixty (60) days of
              a demand by the other Party, before commencing any arbitration. Any mediation and arbitration shall be
              conducted in Los Angeles, or a virtual hearing conducted with video (e.g. Zoom), permanently closed to the
              public, confidential, and all records relating thereto will be permanently sealed (except as necessary to
              obtain court confirmation of the arbitration award). The International Arbitration Rules of the
              International Centre for Dispute Resolution for selection of mediators and arbitrators shall be followed,
              except that the mediator or arbitrator shall be an experienced corporate blockchain arbitrator or a
              retired judge. Any judgment made by the arbitrator is final, binding and non-appealable and may be entered
              in any court of competent jurisdiction. The costs of administering the arbitration (including Arbitral
              fees) shall be borne equally by the Parties. Each Party shall also bear its own expenses with respect to
              its participation in the arbitration. All hearings, proceedings, and written and oral submissions made
              with respect to the arbitration shall be in English. Company shall be entitled to seek injunctive relief
              in addition to all remedies available at law or in equity. Notwithstanding any provision of this Agreement
              or applicable law to the contrary, IP Licensor expressly waives any right to seek, and shall not be
              entitled to, injunctive or other equitable relief in connection with any dispute, claim, or controversy
              arising out of or relating to this Agreement. IP Licensor’s sole and exclusive remedy shall be limited to
              the recovery of monetary damages, subject to the terms and limitations set forth herein.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">12. Further Assurances.</div>
            <div>
              IP Licensor will take or cause to be taken such further actions, and will execute, deliver and file or
              cause to be executed, delivered and filed such further documents and instruments, and will obtain such
              consents, as may be reasonably required or requested by IP Licensor in order to effectuate fully the
              purposes, terms and conditions of this Agreement.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">13. Force Majeure.</div>
            <div>
              IP World will not be deemed to be in default hereunder for failure to perform any of its obligations under
              this Agreement if such failure results from acts or omissions of IP Licensor, third parties, natural
              disasters, pandemics, terrorism, war, civil disorder, state action, labor disputes, telecommunication
              failures, equipment failures, or any other causes beyond IP World’s reasonable control that were not due
              to the misconduct of IP World, for as long as such force majeure event continues.
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold">14. Severability.</div>
            <div>
              Wherever possible, each provision of this Agreement shall be interpreted in such manner as to be effective
              and valid under applicable law, but if any provision of this Agreement shall be prohibited by or invalid
              under applicable law, such provision shall be deemed modified to the extent necessary to make it
              enforceable under applicable law. If any such provision is not enforceable as set forth in the preceding
              sentence, the unenforceability of such provision shall not affect the other provisions of this Agreement,
              but this Agreement shall be construed as if such unenforceable provision had never been contained herein.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">15. Miscellaneous.</div>
            <div>
              IP Licensor agrees: (a) captions are inserted for reference and convenience only and in no way define,
              limit, or describe the scope of this Agreement or intent of any provision; (b) a waiver by IP World of any
              term or condition of this Agreement in any instance shall not be deemed or construed to be a waiver of
              such term or condition for the future, or any subsequent breach thereof; (c) this Agreement shall not give
              any right or remedy to any third party whatsoever unless said right or remedy is specifically granted by
              IP World in writing to such third party; (d) the Parties are independent contractors, and nothing in this
              Agreement shall be deemed to create an agency, employment, partnership or joint venture relationship
              between IP World and IP Licensor; (e) IP World shall have the unrestricted right to assign this Agreement,
              in whole or in part, to any person or entity as IP World may determine from time to time in its sole
              reasonable discretion but IP Licensor may not assign this Agreement without prior written consent; (f)
              this Agreement, along with the IP World Terms of Service, Story Terms of Service and Story PIL or other
              applicable license, contains the entire understanding of the Parties relating to the subject matter
              hereof, no representations or warranties have been made other than those expressly set forth herein; (g)
              this Agreement cannot be changed except by written agreement executed by both Parties hereto; (h) the
              provisions of each term of this Agreement that should by its sense and context survive any termination or
              expiration of this Agreement, shall survive for as long as necessary to effectuate their purposes, and (i)
              this Agreement may be executed by means of facsimile/electronic transmission or original copies, and may
              be executed in counterparts, each of which shall constitute an original but when taken together shall
              constitute one agreement.
            </div>
          </div>
        </div>
      </div>

      <div
        ref={secondScrollRef}
        onScroll={handleSecondScroll}
        className="font-archivo h-[280px] overflow-y-auto rounded-[16px] border bg-neutral-900 p-4 leading-[120%]!"
        style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
      >
        <div className="font-archivo mb-4 text-sm font-semibold">
          PROGRAMMABLE IP LICENSE
          <div className="mt-1 text-xs font-normal">Version 1.4</div>
        </div>

        <div className="font-archivo mb-4 text-xs text-neutral-100">
          This Programmable IP License ("IP License") applies to the use of the IP Asset (defined below) that has been
          made available for licensing via the licensing module of Story Protocol (defined below). This IP License is a
          binding contract that is entered into between the IP Licensor (as defined below) and the lawful owner of the
          Licensing Token (defined below). Although Story Foundation and its affiliates (collectively, "Protocol Software
          Provider") may support the development and operation of the Story Protocol, they are not a party to this IP
          License and have no duty or obligation with respect to this IP License or the use of the IP Asset.
        </div>

        <div className="font-archivo mb-4 text-xs text-neutral-100">
          The lawful owner of the Licensing Token may also be referred to as "you" or "your." By acquiring lawful
          ownership of a Licensing Token (as defined below), you are hereby granted certain rights in the IP Asset as set
          forth below. However, the grant of such license is conditioned on your compliance with the terms of this IP
          License, and when you acquire lawful ownership of a Licensing Token, you hereby agree to comply with this IP
          License.
        </div>

        <div className="font-archivo space-y-6 text-xs leading-[120%]! text-neutral-100">
          <div>
            <div className="mb-2 font-semibold">1. DEFINITIONS.</div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">1.1 "AI Model IP Asset"</span> means an artificial intelligence or
                machine learning model and any related machine-learning code (including trained model weights, parameters,
                inference-enabling code, training-enabling code, fine-tuning enabling code, and any accompanying source
                code and scripts for any of the foregoing) that has been registered to the Story Protocol as being
                available for license.
              </div>
              <div>
                <span className="font-semibold">1.2 "Commercial Use"</span> means any use that is primarily intended for
                or directed towards commercial advantage or monetary compensation.
              </div>
              <div>
                <span className="font-semibold">1.3 "Derivative IP Asset"</span> means any adaptation, derivative work,
                amendment, transformation, modification, remix, or other alteration of the IP Asset.
              </div>
              <div>
                <span className="font-semibold">1.4 "IP Asset"</span> means the AI Model IP Asset or Media IP Asset that
                is the subject of this IP License.
              </div>
              <div>
                <span className="font-semibold">1.5 "IP Asset Policy" or "IPA Policy"</span> means a policy for
                administering a group of IP Assets that is unified by a shared theme, origin or licensing structure, and
                which policy is set forth by the relevant owners of the IP Assets.
              </div>
              <div>
                <span className="font-semibold">1.6 "IP Licensor"</span> means the person or entity who is granting the
                licensed rights under this IP License. The IP Licensor may be the IP Rights Holder or a person or entity
                (such as a licensing agent) who has been authorized by the IP Rights Holder to grant the License.
              </div>
              <div>
                <span className="font-semibold">1.7 "IP Rights Holder"</span> means the person or entity that owns or
                controls the necessary rights in the IP Asset to be able to grant the license set forth in this IP
                License.
              </div>
              <div>
                <span className="font-semibold">1.8 "Licensing Token"</span> means a blockchain-based digital token that
                is created by the IP Licensor and linked to the IP Asset, and which is used to facilitate the grant of the
                License set forth in this IP License.
              </div>
              <div>
                <span className="font-semibold">1.9 "Media IP Asset"</span> means the artwork, image, video, content or
                other work of authorship that has been registered to the Story Protocol as being available for license.
              </div>
              <div>
                <span className="font-semibold">1.10 "Revenues"</span> means the definition that is input by IP Licensor
                in the "Revenues" tag of the License Parameters, if any, or the default definition set forth in Section
                3(j).
              </div>
              <div>
                <span className="font-semibold">1.11 "Revenue Ceiling"</span> means, if applicable, a maximum amount of
                Revenues that you may receive in connection with use of the IP Asset or your Derivative IP Asset, as
                applicable.
              </div>
              <div>
                <span className="font-semibold">1.12 "Revenue Share"</span> means the percentage of Revenues due from you
                to IP Licensor in connection with your use of the IP Asset or your Derivative IP Asset, pursuant to the
                License and License Parameters.
              </div>
              <div>
                <span className="font-semibold">1.13 "Story Protocol"</span> means the blockchain-based openly accessible
                protocol for registering various works of authorship on a public open registry.
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">2. LICENSE.</div>
            <div>
              <span className="font-semibold">2.1</span> For as long as you lawfully own a Licensing Token, IP Licensor
              hereby grants you a right and license to use, copy, reproduce, display, distribute, perform, prepare
              derivative works of (if applicable under the "Derivatives" License Parameter below) and make publicly
              available the IP Asset (the "License"), but solely in accordance with the applicable License Parameters
              described in Section 3 below. The License Parameters are set by IP Licensor upon creation of this Licensing
              Token. If you create any Derivative IP Assets as permitted herein, your right to use, copy, reproduce,
              distribute, perform, prepare further derivative works of, and make publicly available such Derivative IP
              Assets must be consistent with the terms of the License to the same extent as applies to the IP Asset.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">3. LICENSE PARAMETERS.</div>
            <div className="mb-3">
              The IP Asset is provided via a decentralized blockchain-based network (the "Network") that enables permanent
              data storage of the IP Asset and IP Licensor to add certain parameters ("License Parameters") that further
              define the scope of the License and of your use of the IP Asset through "tags". The meaning of each of these
              "tags" is set forth below.
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1 font-semibold">(a) Territory.</div>
                <div>
                  If IP Licensor has tagged "Territory", then your License will only be exercisable in the territories and
                  jurisdictions indicated by the value in the "Territory" tag. If IP Licensor has not tagged "Territory" or
                  if a "Territory" License Parameter is not specified in the License, then your License will be exercisable
                  throughout the universe across all territories and jurisdictions.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(b) Channels of Distribution.</div>
                <div>
                  If IP Licensor has tagged "Channels-of-Distribution", then your License will only be exercisable in the
                  channels of distribution indicated by the value in the "Channels-of-Distribution" tag. If IP Licensor has
                  not tagged "Channels-of-Distribution" or if a "Channels-of-Distribution" License Parameter is not
                  specified in the License, then your License will be exercisable throughout all channels of distribution.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(c) Expiration.</div>
                <div>
                  If IP Licensor has tagged "Expiration", then the term of your License will continue for the time period
                  indicated by the value in the "Expiration" tag, and the License (and all rights granted thereunder) shall
                  automatically expire at the end of such term. If IP Licensor has not tagged "Expiration" or if a
                  "Expiration" License Parameter is not specified in the License, then the term of your License will be
                  perpetual.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(d) Irrevocable.</div>
                <div>
                  If IP Licensor has tagged "Irrevocable", then your License will be irrevocable, unless revocation is
                  otherwise required to ensure compliance with law. If IP Licensor has not tagged "Irrevocable" or if an
                  "Irrevocable" License Parameter is not specified in the License, then your License may be revoked by IP
                  Licensor or the Protocol Software Provider if you materially breach the terms of this IP License.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(e) Attribution.</div>
                <div>
                  If IP Licensor has tagged "Attribution", then (i) on any reproductions of the IP Asset, you shall
                  identify the IP Licensor and/or any other parties designated to receive attribution credit as specified
                  in the value for the "Attribution" tag as the creators of the IP Asset, (ii) on any reproductions of the
                  IP Asset, you shall include a link to the IP Asset if IP Licensor has specified such link in the
                  Attribution tag, (iii) on any Derivative IP Assets, you shall indicate that your Derivative IP Asset is
                  derived from the IP Asset.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(f) Derivatives.</div>
                <div>
                  If IP Licensor has tagged "Derivatives", then you are permitted to create Derivative IP Assets in
                  connection with your exercise of the License. If IP Licensor has not tagged "Derivatives" or if a
                  "Derivatives" License Parameter is not specified in the License, then you are not allowed to create
                  Derivative IP Assets.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(g) Limitations on Creation of Derivatives.</div>
                <div>
                  If IP Licensor has tagged "Derivatives", they may impose limitations on your creation of Derivative IP
                  Assets by also tagging "Derivative-Limitations". This may include caps on the number of unique Derivative
                  IP Assets you may create or category-specific limitations.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(h) Content Standards.</div>
                <div>
                  If IP Licensor has tagged "Content-Standards", IP Licensor will also be required to tag one or more
                  subtags such as "No-Hate", "Suitable-for-All-Ages", "No-Drugs-or-Weapons", or "No-Pornography". If IP
                  Licensor has not tagged "Content-Standards", then no content standards apply to your exercise of the
                  License other than you are required to use the IP Asset in accordance with applicable law.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(i) Commercial Use.</div>
                <div>
                  If IP Licensor has tagged "Commercial-Use", then you are permitted to make both Commercial Use of the IP
                  Asset in connection with your exercise of the License and non-commercial personal use of the IP Asset
                  during the term of the License. If IP Licensor has not tagged "Commercial-Use" or if a "Commercial-Use"
                  License Parameter is not specified in the License, then your License is for non-commercial, personal use
                  only, and no Commercial Use of the IP Asset is allowed.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(j) Revenues.</div>
                <div>
                  If IP Licensor has tagged certain revenue-related parameters, they will also be required to tag
                  "Revenues". If IP Licensor has not provided a definition for Revenues in the value of the "Revenues" tag,
                  then "Revenues" means gross amounts actually received by you, the licensee, in connection with your use
                  and exploitation of the IP Asset or your Derivative IP Asset, as applicable, under this License.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(k) License Minting Fee.</div>
                <div>
                  If IP Licensor has tagged "License-Minting-Fee," then you will be required to pay a one-time license
                  minting fee ("License Minting Fee"). If IP Licensor has not tagged "License-Minting-Fee", then you may
                  exercise the License without paying any License Minting Fee.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(l) Sublicensable.</div>
                <div>
                  If IP Licensor has tagged "Sublicensable", then you may sublicense the rights granted under this License
                  to any other persons or entities. If IP Licensor has not tagged "Sublicensable", then you may not grant
                  any sublicenses of the License to any other persons or entities.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(m) Non-Transferable.</div>
                <div>
                  If IP Licensor has tagged "Non-Transferable", then the License may only be exercised by the original
                  acquirer of the Licensing Token. If IP Licensor has not tagged "Non-Transferable", then you may freely
                  transfer your License to another individual or entity.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(n) Currency.</div>
                <div>
                  The "Currency" tag shall automatically be tagged, and IP Licensor must specify a currency value in this
                  tag. All payments that are required to be made in connection with your exercise of the License will be
                  paid in the currency specified by IP Licensor in this "Currency" tag.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(o) Payment Address.</div>
                <div>
                  If IP Licensor has tagged "Payment-Address", then all License Fees and Revenue Shares due hereunder must
                  be sent to the address indicated by the value in the "Payment-Address" tag.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(p) AI Learning Models.</div>
                <div>
                  If IP Licensor has tagged "AI-Learning-Model-Permitted", then you may use the IP Asset to train, develop,
                  improve or refine other artificial intelligence and/or machine learning models or similar technologies. If
                  IP Licensor has not tagged "AI-Learning-Model-Permitted", then you may not use the IP Asset to train,
                  develop, improve or refine AI Learning Models.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(q) Restriction on Cross-Platform Use.</div>
                <div>
                  If IP Licensor has tagged "Restriction-On-Cross-Platform-Use", then you may only distribute, copy, or
                  sublicense your licensed IP Asset or any Derivative IP Asset on the specific digital application or
                  platform from which you first obtained or received your License.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(r) Governing Law.</div>
                <div>
                  If IP Licensor has tagged "Governing-Law", then this IP License and any action related thereto shall be
                  governed by the laws of the jurisdiction indicated by the value in the "Governing-Law" tag. If IP
                  Licensor has not tagged "Governing-Law", then this IP License will be governed by the laws of the State
                  of California, without regard to its conflict of laws provisions.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(s) Alternative Dispute Resolution.</div>
                <div>
                  If IP Licensor has tagged "Alternative-Dispute-Resolution", then any dispute, controversy, or claim
                  arising out of, relating to or in connection with this IP License shall be resolved in accordance with
                  the process indicated by the applicable subtags.
                </div>
              </div>

              <div>
                <div className="mb-1 font-semibold">(t) Additional License Parameters.</div>
                <div>
                  If IP Licensor has tagged "Additional-License-Parameters", then your License shall also be subject to
                  such additional parameters indicated by the value in the "Additional-License-Parameters" tag.
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">4. LICENSE MINTING FEE, REVENUE SHARE, AND REVENUE CEILING.</div>
            <div>
              If the License is subject to a License Minting Fee according to the License Parameters, then the License
              Minting Fee shall be due to IP Licensor on the date you first lawfully acquire the Licensing Token. If the
              License is subject to a Revenue Share and/or Revenue Ceiling according to the License Parameters, then you
              will be required to provide IP Licensor with documentation on your applicable revenues generated in
              connection with your exercise of the License.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">5. YOUR DERIVATIVE IP ASSETS.</div>
            <div>
              You acknowledge and agree that IP Licensor may (a) create its own future derivatives of the IP Asset, and/or
              (b) grant licenses of the IP Asset to other individuals and entities that may create their own Derivative IP
              Assets from the IP Asset. These derivatives may be similar or identical to your Derivative IP Assets.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">6. RETAINED RIGHTS.</div>
            <div>
              All intellectual property rights in and to the IP Asset and any other intellectual property rights of IP
              Licensor or IP Rights Holder not expressly licensed herein are reserved by IP Licensor or IP Rights Holder.
              Nothing in this IP License is meant to grant you any rights to any logos, trademarks, service marks and trade
              dress associated with IP Licensor, IP Rights Holder or the IP Asset.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">7. TRANSFER.</div>
            <div>
              If your License is tagged as "Transferable" and you lawfully transfer ownership of your Licensing Token, the
              License to you shall terminate upon the effective date of such transfer, and such license will be assigned to
              the new owner of the Licensing Token. As a condition to the transfer of the Licensing Token, the transferee
              agrees upon the acquisition of the Licensing Token that (a) the transferee is not a Restricted Party and (b)
              the transferee accepts this IP License.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">8. ALTERNATIVE DISPUTE RESOLUTION.</div>
            <div>
              If your License has "Alternative-Dispute-Resolution" tagged, then you and IP Licensor agree that in the event
              of any Dispute, either party will first contact the other party and make a good faith sustained effort to
              resolve the Dispute before resorting to more formal means of resolution.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">9. REPRESENTATIONS AND WARRANTIES.</div>
            <div>
              IP Licensor hereby represents and warrants to you that (a) it has the requisite powers, authority, and rights
              necessary to grant the license granted to you hereunder, (b) your exercise of the License will not infringe
              or violate any third-party intellectual property rights, and (c) it has the full power and authority to enter
              into this IP License and to grant the rights and licenses granted by it to you.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">10. RESTRICTIONS.</div>
            <div>
              If a Licensing Token is fractionalized into smaller ownership interests, the rights licensed hereunder do not
              transfer to each of the owners of such fractionalized interests in the Licensing Token. In order to receive
              the Licensing Token if you are an individual, you must be eighteen (18) years of age or older if the age of
              lawful capacity of forming binding contracts is older in the relevant jurisdiction.
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">11. DISCLAIMERS, LIMITATIONS OF LIABILITY, AND INDEMNIFICATION.</div>
            <div className="space-y-3">
              <div>
                <span className="font-semibold">11.1 Disclaimers.</span> YOUR ACCESS TO AND USE OF THE LICENSING TOKEN AND
                IP ASSET IS AT YOUR OWN RISK. EXCEPT AS EXPRESSLY SET FORTH HEREIN, TO THE MAXIMUM EXTENT PERMITTED UNDER
                APPLICABLE LAW, IP LICENSOR AND IP RIGHTS HOLDER AND EACH OF THEIR RESPECTIVE ENTITIES DISCLAIM ALL
                WARRANTIES AND CONDITIONS, WHETHER EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT.
              </div>
              <div>
                <span className="font-semibold">11.2 Limitations of Liability.</span> TO THE EXTENT NOT PROHIBITED BY LAW,
                YOU AGREE THAT IN NO EVENT WILL THE IP LICENSOR ENTITIES BE LIABLE FOR ANY INDIRECT, SPECIAL, EXEMPLARY,
                INCIDENTAL, CONSEQUENTIAL OR PUNITIVE DAMAGES HOWEVER CAUSED AND UNDER ANY THEORY OF LIABILITY.
              </div>
              <div>
                <span className="font-semibold">11.3 Assumption of Risk.</span> LICENSING TOKENS HAVE NO INHERENT VALUE,
                AND THE VALUE OF THE LICENSING TOKENS IS SUBJECTIVE AND CAN THEREFORE BE VOLATILE. YOU AGREE TO ASSUME ALL
                RISK ASSOCIATED WITH THE USE AND VALUE OF THE LICENSING TOKEN AND IP ASSET.
              </div>
              <div>
                <span className="font-semibold">11.4 Fundamental Elements.</span> THE EXCLUSIONS AND LIMITATIONS OF DAMAGES
                SET FORTH ABOVE ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN THE IP LICENSOR ENTITIES AND
                YOU.
              </div>
              <div>
                <span className="font-semibold">11.5 Indemnification.</span> By entering into this IP License and accessing
                or using the Licensing Tokens, you agree that you shall defend, indemnify and hold the IP Licensor Entities
                harmless from and against any and all claims, costs, damages, losses, liabilities and expenses (including
                attorneys' fees and costs) incurred by the IP Licensor Entities arising out of or in connection with your
                violation or breach of any term of this IP License or any applicable law or regulation.
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">12. ADDITIONAL PROVISIONS.</div>
            <div className="space-y-3">
              <div>
                <span className="font-semibold">12.1 Termination of License.</span> If you materially breach any of the
                provisions of this IP License and your License is not tagged as "Irrevocable", then IP Licensor may
                terminate the License. Upon the termination of the License, you shall cease all use of the rights granted
                in Section 2.1, including ceasing all further use of the IP Asset.
              </div>
              <div>
                <span className="font-semibold">12.2 Service Fee.</span> You acknowledge that the Protocol Software
                Provider may charge a fee for use of certain functionality enabled by the Story Protocol in connection with
                this IP License. Service Fees are non-refundable.
              </div>
              <div>
                <span className="font-semibold">12.3 Prevailing Language.</span> Story Foundation or Story Protocol, Inc.
                may make available summaries of the provisions of this IP License. The text of this IP License shall be
                controlling in all respects and shall prevail in case of any inconsistencies with such summaries, if any.
              </div>
              <div>
                <span className="font-semibold">12.4 Miscellaneous.</span> This IP License constitutes the entire and
                exclusive understanding and agreement between IP Licensor and you regarding the Licensing Token and
                supersedes and replaces any and all prior oral or written understandings or agreements between IP Licensor
                and you regarding the Licensing Token.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <CheckRow
          label="I have read and agree to the IP World Memetic Launchpad Terms "
          disabled={!canCheckBoxes}
          checked={termsLaunchpadAgreed || false}
          onCheckedChange={(checked) => form.setValue("terms_launchpad_agreed", checked as boolean)}
        />
        <CheckRow
          label="I understand and agree that a Story Protocol Programmable IP License (PIL) will be created upon verification approval"
          disabled={!canCheckBoxes}
          checked={termsPilAgreed || false}
          onCheckedChange={(checked) => form.setValue("terms_pil_agreed", checked as boolean)}
        />
      </div>
    </div>
  )
}

function CheckRow({
  label,
  disabled = false,
  checked,
  onCheckedChange,
}: {
  label: string
  disabled?: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-neutral-700"
        }`}
      style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
    >
      <Checkbox
        className="h-5 w-5 rounded-[4px]"
        disabled={disabled}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <span className="font-archivo text-sm font-medium">{label}</span>
    </label>
  )
}
