# 04 - Screens and Flows

All screens are mobile-first, with big buttons. The office side is English only; the master's screens have an English / اردو / বাংলা / हिन्दी button (16-17 Nov 2026, see the last section). "It doesn't have to be pretty, just functional."

## Admin screens

### A1. Order list (home)
- All active orders in **priority sequence** (1, 2, 3...).
- Each row: order number, customer name, assigned master, both due dates, current progress, colour band.
- Colour coding: **red = urgent**, **green = coming due**, **blue = low priority** (final thresholds to confirm).
- Move up / move down buttons on each row (drag and drop later). Moving an order up makes it more urgent.
- **Seen** tick per order showing whether (and when) the master opened it. This replaces the WhatsApp "read" tick Anas uses today.
- Badge counts: photos waiting for review, shipments submitted.
- Filters: master, status. Button: New order.

### A2. Create / edit order
1. Enter customer name, order number, **My due date**, optional **Event date** (admin only; the Customers list shows it with the days left), **Karigar due date**, and assigned master.
2. Tick which items this order needs (Sherwani, Kurta, Pants, Pagri, Shoes, Shawl, Vest...). Unticked items are skipped, and the same item can be added twice.
3. For each ticked item, the app shows that item's **pre-built template form** (design number, fabric, colour, embroidery notes, measurements, reference picture...).
4. On save, if any item field is empty the app lists what is missing, for example "You haven't given sleeve length", and saves nothing until it is filled.
5. Saving adds the order at the end of the priority sequence and may notify the master.

### A3. Template builder
- Create, rename and delete main categories and sub-categories (Men > Sherwani, Ladies > Sharara, Shoes, Bomber jackets, Toys...).
- Per sub-category: add, remove and reorder fields. Field types: text, number, date, picture, yes/no.
- Per field: required or optional.
- Per stage: add, remove and reorder, and mark **photo required**.
- Must be easy: Anas should add a new sub-category such as Indo-western without a developer.

### A4. Review queue
- Photos waiting for approval, newest first, with order and item context.
- Actions: **Approve**, **Reject** with comment. A voice note was floated (later).
- Approval unlocks the next stage and notifies the master.

### A5. Masters
- Create or deactivate a master, generate the personal link, set or reset the PIN.
- Button to copy a prefilled WhatsApp message with the link.

### A6. Archive
- Completed and cancelled orders, read-only, rarely used.

## Master screens

### M1. PIN screen
Open the personal link, enter the personal code (one large input; numbers and letters allowed, e.g. `1234A`), and go to the dashboard.

### M2. Dashboard
- The master's assigned orders in **Anas's sequence**.
- Cannot reorder. Priority shown by colour band.
- Row: customer name, **Karigar due date** only, current stage, item count.
- Badges: **New** (not opened yet), **Updated** (Admin changed details or the Karigar due date since the master last looked), **Moved up** (priority raised).
- Cancelled orders show "Cancelled" until they time out.

### M3. Order detail (read-only)
- Item boxes: each item (Sherwani, Kurta...) shows its heading and description, all field values, all measurements, and reference pictures.
- Measurements appear in a compact card that fits one phone screen, so the master can **screenshot it and send it to a karigar** on WhatsApp (Anas asked for this).
- Buttons: Print, Open stage actions.

### M4. Stage actions
- Shows the current stage for an item.
- If the stage requires a photo: **Take / upload photo** (camera opens directly), then the status shows "Waiting for approval".
- After Admin approves, a **Mark complete** button appears and the next stage unlocks.
- If rejected: the comment is shown and the master uploads again.

### M5. Shipping checklist
- Finished items of all the master's customers are in his **cart** automatically; he can take out any he is not sending today.
- Tick each item to confirm it is physically present.
- Optionally take a photo of the packed items as proof.
- The **bill** photo and a packed-items photo are optional: in the "Before you send" list each has a round plus that opens the camera (17 Nov 2026; before, they were two sections of the page).
- **Submit** works once all ticked items are confirmed. The bill photo is optional (16 Nov 2026).

### M6. Print / export
- Prints or exports PDF: **one page per item type per order**.
- Admin can configure which items share a page (for example Pagri + Shoes), to save printing cost.
- Measurements and attached pictures **auto-resize** to fit one page.
- Print-friendly black and white layout.
- **Print tailor slips** prints only the tailor slips page, the same way.
- **Print** prints the same PDF as Download PDF (16 Nov 2026), so the paper looks the same on every phone: on a computer the print window opens, on a phone or tablet the PDF opens to print from there (iPhone: Share > Print).
- **Download / share PDF** button. Masters often print at an internet cafe or print shop, so they need a PDF file they can send on WhatsApp, not only the phone's print dialog.

## Key flows

### Create and assign an order
Admin creates order -> ticks items -> fills templates -> assigns master -> order joins end of sequence -> master gets WhatsApp message (optional) -> master sees it on dashboard.

### Reprioritise
Admin moves an order up -> sequence renumbers -> master's dashboard re-sorts, and the order shows as urgent. Admin can also change due dates; the change is reflected immediately.

### Photo gate
Master completes work -> uploads compressed photo -> status `pending` -> Admin approves or rejects with comment -> if approved, next stage unlocks and the master is notified; if rejected, the master re-uploads.

### Shipping
Finished items go into the master's cart (all customers) -> he uploads one bill -> submits -> Admin receives a copy of the bill and the shipment record. The bill photo is optional; checkout is blocked only until the items are ticked as present.

### Cancel an order
Admin sets the order to cancelled -> master sees "Cancelled, stop work" and is notified (they may be mid-work) -> it later moves to archive. It is never hard-deleted.

### Admin alerts
Admin is alerted when a photo is waiting for review and when a shipment is submitted (badge in the app; WhatsApp optional).

### Reminders
If an order is overdue or has had no update for a set period (for example a week), it is flagged in colour, and optionally a reminder is sent to the master.

### Remake
Admin opens the customer, opens **Remake items**, ticks the items that must be made again, writes why, and presses **Send back for remake**. The order goes active again (late, because the due date is unchanged), the master is told through the usual WhatsApp banner and sees a "Remake" tag and the reason. When the item is finished again it goes into the master's cart and is sent in a new shipment.

### Customers list
Filter chips (overdue, urgent, coming due, on time, work stages) plus **Sort by due date** (earliest Karigar due date first; the up/down arrows rest while it is on). The up/down arrows swap an order with the one next to it in the list, whatever its master. An overdue order's whole card turns red (red-tinted background and border, a glowing red dot), not only its due date box.


## Items page order
Admin can drag the categories of a group (Kurta, Pants...) into any order with the dots handle; the order is saved at once and also used in the sidebar and when choosing items for a customer.

## Order PDF
Customer form: "Order PDF" box under the masters (choose a PDF, saved with the customer; View and Remove for saved ones). Master order page: "Order PDF" with a View button per file.

The Masters page shows each master as a card: name and status, progress (items, made, percent), his link with Copy, Send link on WhatsApp, Set PIN, New link, Deactivate, Delete.

## Item builder additions (12 Nov 2026)
- Group of boxes: per box a name, "Words or numbers" / "Numbers only", and "Pictures next to it". A plain field has a "What can be typed" box.
- "Copy fields from another item" in the builder; "Make a copy" at the bottom of an item page; "Copy this group with its items" on the Items page.

## Drafts and Send (12 Nov 2026)
- New customer: "Save, send later" (draft) or "Save and send to master". Saving a draft goes back to the Customers list with a "Draft saved" notice; on a draft's page there are "Save draft" and "Send to master". The Customers list tags drafts "Draft, not sent" and has a Drafts chip.

## Notes pictures and Paragraph (12 Nov 2026)
- Under "Extra notes for this customer" there is always a picture box; saved pictures can be removed. The master sees them under the notes.
- The item builder has a "Paragraph" tile (free writing, pictures switched on from the start).

- Fields that allow pictures show a small + at the end of the box (same row); chosen pictures appear below it. Ctrl+V works in the box.

## Compact customer form (12 Nov 2026)
- Customer details three to a row, Order PDF on one row, the item picker one row per group, item fields in a grid (numbers four to a row, text three, long writing two). The notes box shares its row with the picture +.

- Admin customer page: an item's steps are shown side by side as numbered boxes with a status colour on top; an opened box takes the whole row.

- Item builder: "All fields at once" switches Warn if empty and Master can fill on or off for every field. Only fields with Warn if empty get a red * on the customer form and block sending.

- Measurement fields accept words as well as numbers; the unit (No unit, Inches, Meters, Centimetres) is chosen per field in the item builder.
- Picture fields on the customer form have a dashed spot: on a phone press and hold, then tap Paste; on a computer click and press Ctrl+V; or drop a file on it.
- A picture pasted into any text or number box on the customer form stays under that box (also for the master and in print). A sent customer's page has the WhatsApp buttons to tell each master about the new or changed order.
- On the customer form a field with pictures is framed, with its pictures right under its own box.
- Steps have a "Should take N days once started" box (item builder custom steps and the saved steps editor). The office sees the finish date and "Late by N days"; the master sees only the days.
- Masters page: "Your WhatsApp number" box (it was where masters' questions went; the master's "Ask the office a question" button was removed on 17 Nov 2026, so nothing uses the number now).
- Item builder: "From the order" tiles Customer name, Order number, Design number and Delivery date (start filled from the order; the office can change them).
- Master order page: empty fields are hidden; a "Warn if empty" field that is empty shows its name with a blank box.
- Master home: the whole order card opens the order (no Open order button).
- A text box takes several lines (Enter = new line; pasted lines stay apart) and the master sees each line on its own line.
- The printed measurements table holds number and word boxes together in form order; a unit is added only after a plain number.
- Printed sheet / PDF: each item ends with a "Cut here - tailor slip" box (customer name, order number, measurements in short names, notes, no dates). Builder: short name per measurement box, a Notes line tile, and a notes line option on a group of boxes.
- A field that has pictures takes a full row on the customer form (field on top, pictures under it).
- Customer form: back to the earlier look (two columns, larger labels); the new features stay.
- Sending with a "Warn if empty" field still empty: the first press shows the list and sends nothing, the next press sends anyway.

## Design Category (13 Nov 2026)
- Sidebar: Design Category, after Masters. The page has an "Add a design" form (design number, notes, pictures) and a grid of design cards; a card opens its edit page (change the number or notes, add or remove pictures, hide from the customer form).
- Customer form: the item's **Design number** box is a dropdown of these design numbers, with the chosen design's pictures shown small under it. Press Save and the pictures are copied onto the item. The master sees them under "Reference pictures" at the end of the item (after the form and the steps); print and PDF include them.

- Customers list (13 Nov 2026): the small "Steps N of M" progress card on each customer card was removed by request; the "Fields" card and everything else stay. The master home cards still show "Steps N of M" as a pill.

- Pictures (13 Nov 2026): every picture the office adds has a cross to remove it (waiting, saved under a field, under the notes, in a design). The master has none: he cannot delete.

- Print and PDF with pictures (13 Nov 2026): a short answer with up to 3 pictures stays in the measurements table with its pictures small inside its box; the PDF draws the table row by row; the Pictures block can continue on the next page.

## Measurement layout like the tailor's sheet (13 Nov 2026)
- The tailor slips are collected on a "Tailor slips" page at the end of the printed order (14 Nov 2026; the karigar paper stays under its item). The print page (office and master) has a "Download tailor slips" button next to Download PDF that downloads only that page (shown only when the order has a slip). Each slip copies the tailor's own paper: "Customer Name X   Item Measurements", then rows of names (underlined) with the value under a line and a small note under a box if there is one. The main sheet keeps its ruled table. Row size is set in the item builder ("Boxes in one printed row" on the Measurements heading or group, "Starts a new row" on a box). On the customer form every measurement box can have a small note under it (for example Add 1 inch); the master sees it under the box.

## Printed slips (14 Nov 2026)
- Item builder, below the Steps: "Printed slips". A dropdown chooses what the printed order has at the bottom of each item: Tailor slip (default), Karigar paper, Both, or No slip. For the karigar paper the office drags the boxes of the form into rows (Add a row; boxes in "Not used" do not print). The printed order then has a second cut-off paper: the customer name and order number, then rows of short names (underlined) with the value under each, for the master to copy by hand.
- What goes on the tailor slip: each field has "Print on the tailor slip" (on by default under Measurements; "All fields at once" has an On tailor slip row). Under Printed slips, "Also on the tailor slip" adds Design number, Colour and Item count (1 of 2) to the slip's header line.

- Links for masters (14 Nov 2026): on the client's machine https is served on the same port 3002 (`deploy/linux/setup-https.sh`, undo with `rollback-https.sh`); `APP_URL` is the https address, so WhatsApp links are blue and open when tapped. Everybody, the office included, then uses the https address.

## Urdu, Bengali and Hindi on the master's screens (16-17 Nov 2026, client request: "they do not understand English")
- A pill button **English | اردو | বাংলা | हिन्दी** sits at the top right of every master page (also on the code screen). The choice is kept on that phone (`localStorage` key `master-lang`) and the next visit opens in the same language. Printing (`/print`) has no button and stays English.
- Urdu on: every text on the page is swapped for Urdu and the page reads right to left, in the Noto Naskh Arabic face. Bengali on: the same, left to right, in the Noto Sans Bengali face (standard Bengali, also fine for West Bengal). Hindi on: the same, left to right, in the Noto Sans Devanagari face. Switching back to English puts every text back exactly as it was.
- How: `src/components/LanguageLayer.tsx` (in `src/app/m/[token]/layout.tsx`) walks the text of the page, also placeholders, titles, aria-labels and alt text, and watches for changes (a refresh, a step finished). Nothing is translated on the server, so the English page is the page.
  1. The words of the app itself come from the hand-written lists in `src/lib/urdu.ts`, `src/lib/bengali.ts` and `src/lib/hindi.ts` (words, months, history lines like "Naseem finished Cutting", dates like "12 November 2026", numbers kept). They are exact, free and work offline.
  2. Any other text (field names, notes, step names, colours the office typed) is asked from `POST /api/m/[token]/translate` (needs the master's code), which uses Google Cloud Translation (`GOOGLE_TRANSLATE_API_KEY`) and saves each answer per language in the `text_translations` table, so a text is translated once per language. Without a key those texts stay English.
- Never translated: anything inside `translate="no"` (customer names, design numbers, the master's name, the cart lines), numbers, codes, links, and the printed sheet and the PDF, which stay English.
- Write new master-screen sentences as ONE piece of text (a template string), not as pieces around `{values}`, and add it to both lists with `{n}` where a number goes. Wrap names in `<bdi translate="no">`.

## Pictures for the steps (17 Nov 2026)
- On the master's screens a step has a picture, with its name small next to or under it: scissors (cutting), a spool of thread and a needle (stitching), a sewing machine (embroidery), magnifier with a tick (quality / final check), hanger (trial), box (packing), truck (shipped), clipboard (order received), iron, button, tape, cloth, drop. A step whose name has no known word has no picture.
- The progress bar of an order or item shows them in circles (done = filled with a small green tick, now = ringed, to come = pale), the names under them in small writing; with many steps the bar swipes sideways when they do not fit (no scrollbar is drawn). On the order page each step box is a big picture with the name beside it, a tick when done and a lock when it cannot be done yet. "My pending work" cards and the "To make" chip show the picture and the words.
- The four tiles of the master's home page are a picture with the name small under it and the count in the corner (hanger = items, clock = my pending work, truck = cart, tick = finished). "I have seen this order" has an eye, "Mark complete" a tick.
- The master's "Ask the office a question" button was removed (17 Nov 2026).
- The picture comes from words in the step name (`src/lib/step-icon.ts`).

## Master order page: tidier steps (17 Nov 2026)
- The order card has no "In Progress" label (only Completed or Cancelled). The days-left chip is bigger.
- A finished step folds up into one row (picture, name, tick); tap it to see its notes and pictures. Steps still to do stay open.
- "Add note" and "Mark complete" are smaller buttons, not full width.

## Step buttons and the shipment photos (17 Nov 2026)
- On the master's order page "Mark complete" is at the end of the step's row, next to its name. A note is optional: tap the round plus under the step to write one.
- On the cart page the two photo boxes are gone; the bill photo and the packed-items photo are plus buttons on their rows in "Before you send".

## Green and red steps, tick or cross in the cart (17 Nov 2026)
- On the master's order page a finished step is a green card, the step to do now a red card, and later steps a paler red.
- In the cart the red cross to take an item out is only in "Your shipment". In the "Pending shipment" list an item that is in the shipment has no button; an item that is out has a red row and a green tick that puts it back. The "Add" button is gone.

## Cart layout (17 Nov 2026)
- On a wide screen "Your shipment" is on the left and the finished items are on the right, under the heading "Pending shipment" (before: "What are you sending?"). On a phone the items come first, then the shipment panel.

## Master History (17 Nov 2026)
- A **History** tile next to Finished opens a list of everything the master has sent, newest first. Each is a folded row (the date, who it was for); tap it to open the customer, design and items, each in its own small box, and a small bill picture with a small Download bill button and the packed-items picture. It stays after the orders are completed (Finished does not keep them). "Sent back" marks an item that came back for a remake. "No bill photo" when none was taken.

## Finished hidden, smaller on a phone (17 Nov 2026)
- The Finished tile is hidden on the master's home page for now (the page still exists). The home tiles are Items, My pending work, Cart and History.
- On a phone the master's screens are a little smaller (text, buttons, tiles). Wider screens are unchanged.

## Narrow phones (17 Nov 2026)
- On a narrow phone the step names under the progress bar no longer overlap (the bar swipes sideways when needed), and in a step card the name is shown in full with "Mark complete" on the next row when it does not fit beside the name.

## Pending shipment (17 Nov 2026)
- In the cart an item is shown once: in "Your shipment". "Pending shipment" only lists items the karigar took out with the cross (a red card with a green tick to put it back); it is hidden when nothing is out.

## Live board: dates, links, sorting (22 Nov 2026)
- Each pending order on the Live board shows My due, Karigar due and Event (with days left). Tapping an order, in the stage columns or in the Pending list, opens that customer.
- The Pending list has Sort by Karigar due / My due / Event date buttons (orders with no event date go last by event) and a "Show all" link instead of "+N more". The board is for the office only: it shows My due date and Event date, so keep it off any screen a master can see.
- The customer form and the Customers list also have the optional Event date (see A2 and rule 2).
- The chosen date is tinted in every row; pressing the chosen Sort button again turns the order round (earliest first or latest first, arrow on the button). A line under the heading says what it is sorted by, and tells when every order has the same date.
- An **All (N)** button next to the Sort buttons shows every pending order, and pressing it again goes back to the first 14.

## Order video (23 Nov 2026)
- The customer form has an **Order video** box under the Order PDF box: choose one or more videos (MP4, MOV or WebM, 50 MB each); they are saved with the customer. The customer page lists them with Watch and a cross (asks first).
- The master sees a **Video** block on his order page with a player; the video downloads only when he taps play. He cannot add or remove videos. The video is not part of the printed sheet or the PDF.
- The Order PDF and Order video boxes sit side by side on a wide screen and one under the other on a phone.

## Undo a step (23 Nov 2026)
- On the master order page a finished step is folded; opening the **last step he finished** shows "Pressed Mark complete by mistake? Undo this step". The step opens again and the next one locks again. It cannot be undone once the item was sent, or if a later step is finished, or if the office finished it. The office has "Finished by mistake? Reopen this step" on the last finished step of an item. The history shows "reopened".
