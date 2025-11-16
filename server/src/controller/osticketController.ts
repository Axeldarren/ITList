import { Request, Response } from "express";
import mysql from "mysql2/promise";

// Fetch tickets with status "CR"
export const getTicketsWithStatusCR = async (req: Request, res: Response): Promise<void> => {
    try {
        const osticketConnection = await mysql.createConnection({
            host: process.env.OSTICKET_DB_HOST,
            user: process.env.OSTICKET_DB_USER,
            password: process.env.OSTICKET_DB_PASSWORD,
            database: process.env.OSTICKET_DB_NAME,
        });

        const [rows] = await osticketConnection.execute(
            `SELECT a.number ticket_id,
                c.subject description_ticket,
                i.name ticket_status,
                a.created
            FROM   ostiket.ost_ticket a 
                left join ostiket.ost_staff b on a.staff_id = b.staff_id
                left join ostiket.ost_ticket__cdata c on a.ticket_id = c.ticket_id
                left join (select *
                            from   (select a.object_id,b.entry_id,substr(b.value,3,6) office_code,trim(both '"}'from substr(b.value,12))office_name from ostiket.ost_form_entry a left join ostiket.ost_form_entry_values b on a.id = b.entry_id where b.field_id = 37) a
                                    left join (select a.id,substr(b.value,3,instr(trim(both '{"' from b.value),'"')-1) category from ostiket.ost_form_entry a left join ostiket.ost_form_entry_values b on a.id = b.entry_id where b.field_id = 45) b on a.entry_id = b.id) h on a.ticket_id = h.object_id
                left join ostiket.ost_ticket_status i on a.status_id = i.id
            WHERE  h.category = "CR" AND i.name = "OPEN" 
            order by a.ticket_id`
        );

        res.status(200).json(rows);
    } catch (error: any) {
        res.status(500).json({ message: `Error fetching tickets with status 'CR': ${error.message}` });
    }
};

// Fetch tickets with status "Open"
export const getTicketsWithStatusOpen = async (req: Request, res: Response): Promise<void> => {
    try {
        const osticketConnection = await mysql.createConnection({
            host: process.env.OSTICKET_DB_HOST,
            user: process.env.OSTICKET_DB_USER,
            password: process.env.OSTICKET_DB_PASSWORD,
            database: process.env.OSTICKET_DB_NAME,
        });

        const [rows] = await osticketConnection.execute(
            `SELECT a.number ticket_id,
                c.subject description_ticket,
                i.name ticket_status,
                a.created
            FROM   ostiket.ost_ticket a 
                left join ostiket.ost_staff b on a.staff_id = b.staff_id
                left join ostiket.ost_ticket__cdata c on a.ticket_id = c.ticket_id
                left join (select *
                            from   (select a.object_id,b.entry_id,substr(b.value,3,6) office_code,trim(both '"}'from substr(b.value,12))office_name from ostiket.ost_form_entry a left join ostiket.ost_form_entry_values b on a.id = b.entry_id where b.field_id = 37) a
                                    left join (select a.id,substr(b.value,3,instr(trim(both '{"' from b.value),'"')-1) category from ostiket.ost_form_entry a left join ostiket.ost_form_entry_values b on a.id = b.entry_id where b.field_id = 45) b on a.entry_id = b.id) h on a.ticket_id = h.object_id
                left join ostiket.ost_ticket_status i on a.status_id = i.id
            WHERE  i.name = "OPEN" 
            order by a.ticket_id`
        );

        res.status(200).json(rows);
    } catch (error: any) {
        res.status(500).json({ message: `Error fetching tickets with status 'Open': ${error.message}` });
    }
};
