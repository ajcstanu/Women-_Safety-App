"""
Contacts routes: /api/contacts — CRUD for emergency contacts
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user_id
from store import store

router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    phone: str
    relation: str = "Contact"


@router.get("/")
async def get_contacts(user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"contacts": user.get("emergency_contacts", [])}


@router.post("/", status_code=201)
async def add_contact(body: ContactRequest, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(user.get("emergency_contacts", [])) >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 emergency contacts allowed")

    contact = {"name": body.name, "phone": body.phone, "relation": body.relation}
    user.setdefault("emergency_contacts", []).append(contact)
    store["users"][user_id] = user
    return {"success": True, "contacts": user["emergency_contacts"]}


@router.put("/{index}")
async def update_contact(index: int, body: ContactRequest, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    contacts = user.get("emergency_contacts", [])
    if index < 0 or index >= len(contacts):
        raise HTTPException(status_code=404, detail="Contact not found")
    contacts[index] = {"name": body.name, "phone": body.phone, "relation": body.relation}
    store["users"][user_id] = user
    return {"success": True, "contacts": contacts}


@router.delete("/{index}")
async def delete_contact(index: int, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    contacts = user.get("emergency_contacts", [])
    if index < 0 or index >= len(contacts):
        raise HTTPException(status_code=404, detail="Contact not found")
    contacts.pop(index)
    store["users"][user_id] = user
    return {"success": True, "contacts": contacts}
