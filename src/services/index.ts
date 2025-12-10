import { NoteService } from './NoteService';
import { CatalogService } from './CatalogService';
import { UserService } from './UserService';


export const noteService = new NoteService();
export const catalogService = new CatalogService();
export const userService = new UserService();


export { NoteService, CatalogService, UserService };